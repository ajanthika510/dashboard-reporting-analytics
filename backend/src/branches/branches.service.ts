import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UpdateBranchStatusDto } from './dto/update-branch-status.dto';

const branchSelect = {
  id: true,
  name: true,
  code: true,
  location: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  private handlePrismaError(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A branch with this code already exists.',
      );
    }
    throw error;
  }

  async create(dto: CreateBranchDto) {
    try {
      return await this.prisma.branch.create({
        data: {
          name: dto.name.trim(),
          code: dto.code.trim().toUpperCase(),
          location: dto.location?.trim() || null,
        },
        select: branchSelect,
      });
    } catch (error: unknown) {
      this.handlePrismaError(error);
    }
  }

  async findAll() {
    return this.prisma.branch.findMany({
      select: branchSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllActive() {
    return this.prisma.branch.findMany({
      where: { isActive: true },
      select: branchSelect,
      orderBy: { name: 'asc' },
    });
  }

  async findUserBranches(branchId: string) {
    return this.prisma.branch.findMany({
      where: { id: branchId, isActive: true },
      select: branchSelect,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      select: branchSelect,
    });

    if (!branch) {
      throw new NotFoundException('Branch not found.');
    }
    return branch;
  }

  async update(id: string, dto: UpdateBranchDto) {
    const existing = await this.prisma.branch.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Branch not found.');
    }

    const data: {
      name?: string;
      code?: string;
      location?: string;
    } = {};

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.code !== undefined) data.code = dto.code.trim().toUpperCase();
    if (dto.location !== undefined) data.location = dto.location.trim();

    try {
      return await this.prisma.branch.update({
        where: { id },
        data,
        select: branchSelect,
      });
    } catch (error: unknown) {
      this.handlePrismaError(error);
    }
  }

  async updateStatus(id: string, dto: UpdateBranchStatusDto) {
    const existing = await this.prisma.branch.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Branch not found.');
    }

    return this.prisma.branch.update({
      where: { id },
      data: { isActive: dto.isActive },
      select: branchSelect,
    });
  }
}
