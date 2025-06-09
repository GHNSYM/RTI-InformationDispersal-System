-- Add new columns to rti_requests table
ALTER TABLE rti_requests 
ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS assignment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS assistant_remarks TEXT;

-- Create enum type for review_status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE enum_rti_requests_review_status AS ENUM ('Pending', 'Reviewed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add review_status column
ALTER TABLE rti_requests 
ADD COLUMN IF NOT EXISTS review_status enum_rti_requests_review_status NOT NULL DEFAULT 'Pending';

-- Create index for assigned_to
CREATE INDEX IF NOT EXISTS idx_rti_requests_assigned_to ON rti_requests(assigned_to);
