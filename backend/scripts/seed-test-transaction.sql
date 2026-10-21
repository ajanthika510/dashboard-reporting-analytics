INSERT INTO "Transaction" (
    "id", "reference", "type", "status", "amount",
    "currency", "description", "branchId", "ticketId"
)
SELECT
    '7c93b6a1-2c41-4d78-9f21-6a5b8c0d1002',
    'TEST-EXPORT-20261015-SALE-001',
    'SALE',
    'COMPLETED',
    1250.00,
    'LKR',
    'Temporary CSV export test sale',
    '25e2baeb-200a-41d8-97b2-39a671fcf462',
    t."id"
FROM "Ticket" t
WHERE t."ticketNumber" = 'TEST-EXPORT-20261015-001'
ON CONFLICT ("reference") DO NOTHING;
