INSERT INTO "Ticket" (
    "id", "ticketNumber", "title", "description",
    "status", "priority", "amount", "branchId"
)
VALUES (
    '7c93b6a1-2c41-4d78-9f21-6a5b8c0d1001',
    'TEST-EXPORT-20261015-001',
    'CSV Export Test Ticket',
    'Temporary test record for export verification',
    'OPEN',
    'HIGH',
    1250.00,
    '25e2baeb-200a-41d8-97b2-39a671fcf462'
)
ON CONFLICT ("ticketNumber") DO NOTHING;
