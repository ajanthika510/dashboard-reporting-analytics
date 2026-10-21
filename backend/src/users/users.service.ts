import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  branchId: true,
  createdAt: true,
  updatedAt: true,
  branch: {
    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
    },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateBranch(branchId?: string | null): Promise<void> {
    if (!branchId) return;

    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, isActive: true },
    });

    if (!branch || !branch.isActive) {
      throw new BadRequestException(
        'The specified branch ID is invalid or refers to an inactive branch.',
      );
    }
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const branchId = dto.branchId ?? (dto.branchIds && dto.branchIds.length > 0 ? dto.branchIds[0] : null);

    await this.validateBranch(branchId);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      return await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email,
          passwordHash,
          role: dto.role ?? UserRole.VIEWER,
          isActive: dto.isActive ?? true,
          branchId,
        },
        select: safeUserSelect,
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A user with this email already exists.');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actorUserId: string,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found.');
    }

    if (id === actorUserId) {
      if (dto.role !== undefined && dto.role !== existingUser.role) {
        throw new ForbiddenException(
          'You cannot change your own administrator role.',
        );
      }

      if (dto.isActive === false) {
        throw new ForbiddenException(
          'You cannot deactivate your own account.',
        );
      }
    }

    const isRemovingActiveAdministrator =
      existingUser.role === UserRole.ADMINISTRATOR &&
      existingUser.isActive &&
      ((dto.role !== undefined && dto.role !== UserRole.ADMINISTRATOR) ||
        dto.isActive === false);

    if (isRemovingActiveAdministrator) {
      const activeAdministratorCount = await this.prisma.user.count({
        where: {
          role: UserRole.ADMINISTRATOR,
          isActive: true,
        },
      });

      if (activeAdministratorCount <= 1) {
        throw new ForbiddenException(
          'The last active administrator cannot be demoted or deactivated.',
        );
      }
    }

    const branchId = dto.branchId !== undefined
      ? dto.branchId
      : dto.branchIds && dto.branchIds.length > 0
        ? dto.branchIds[0]
        : undefined;

    if (branchId !== undefined) {
      await this.validateBranch(branchId);
    }

    const data: any = {};

    if (dto.name !== undefined) data.name = dto.name.trim();

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const duplicate = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('A user with this email already exists.');
      }

      data.email = email;
    }

    if (dto.password !== undefined) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (branchId !== undefined) data.branchId = branchId;

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: safeUserSelect,
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A user with this email already exists.');
      }
      throw error;
    }
  }
}
