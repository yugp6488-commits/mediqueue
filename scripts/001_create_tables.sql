-- Hospital Management System Database Schema

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  avatar_color TEXT DEFAULT 'blue',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients table (queue entries)
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  department_id UUID REFERENCES departments(id),
  assigned_doctor_id UUID REFERENCES doctors(id),
  severity TEXT CHECK (severity IN ('Low', 'Moderate', 'High')) DEFAULT 'Low',
  symptoms TEXT,
  status TEXT CHECK (status IN ('waiting', 'in-progress', 'completed', 'cancelled')) DEFAULT 'waiting',
  queue_number INT,
  estimated_wait_minutes INT DEFAULT 30,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient history / visit records
CREATE TABLE IF NOT EXISTS visit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  patient_email TEXT,
  department TEXT,
  doctor_name TEXT,
  diagnosis TEXT,
  prescription TEXT,
  visit_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DB logs for admin panel
CREATE TABLE IF NOT EXISTS db_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT CHECK (operation IN ('INSERT', 'UPDATE', 'SELECT', 'DELETE', 'ALERT')) NOT NULL,
  table_name TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default departments
INSERT INTO departments (name) VALUES 
  ('General Medicine'),
  ('Emergency'),
  ('Pediatrics'),
  ('Cardiology'),
  ('Orthopedics'),
  ('Neurology'),
  ('Dermatology')
ON CONFLICT (name) DO NOTHING;

-- Insert sample doctors
INSERT INTO doctors (name, specialty, department_id, avatar_color, is_available) 
SELECT 'Dr. Sarah Chen', 'General Practitioner', d.id, 'emerald', true
FROM departments d WHERE d.name = 'General Medicine'
ON CONFLICT DO NOTHING;

INSERT INTO doctors (name, specialty, department_id, avatar_color, is_available) 
SELECT 'Dr. James Wilson', 'Emergency Medicine', d.id, 'rose', true
FROM departments d WHERE d.name = 'Emergency'
ON CONFLICT DO NOTHING;

INSERT INTO doctors (name, specialty, department_id, avatar_color, is_available) 
SELECT 'Dr. Emily Rodriguez', 'Pediatrician', d.id, 'amber', true
FROM departments d WHERE d.name = 'Pediatrics'
ON CONFLICT DO NOTHING;

INSERT INTO doctors (name, specialty, department_id, avatar_color, is_available) 
SELECT 'Dr. Michael Park', 'Cardiologist', d.id, 'sky', true
FROM departments d WHERE d.name = 'Cardiology'
ON CONFLICT DO NOTHING;

INSERT INTO doctors (name, specialty, department_id, avatar_color, is_available) 
SELECT 'Dr. Lisa Thompson', 'Orthopedic Surgeon', d.id, 'violet', false
FROM departments d WHERE d.name = 'Orthopedics'
ON CONFLICT DO NOTHING;

-- Create function to log database operations
CREATE OR REPLACE FUNCTION log_db_operation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO db_logs (operation, table_name, details)
  VALUES (TG_OP, TG_TABLE_NAME, 
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'New record created'
      WHEN TG_OP = 'UPDATE' THEN 'Record updated'
      WHEN TG_OP = 'DELETE' THEN 'Record deleted'
      ELSE 'Unknown operation'
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for logging
DROP TRIGGER IF EXISTS log_patients_changes ON patients;
CREATE TRIGGER log_patients_changes
  AFTER INSERT OR UPDATE OR DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION log_db_operation();

DROP TRIGGER IF EXISTS log_doctors_changes ON doctors;
CREATE TRIGGER log_doctors_changes
  AFTER INSERT OR UPDATE OR DELETE ON doctors
  FOR EACH ROW EXECUTE FUNCTION log_db_operation();

-- Create function to generate queue numbers
CREATE OR REPLACE FUNCTION generate_queue_number()
RETURNS TRIGGER AS $$
DECLARE
  today_count INT;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM patients
  WHERE DATE(check_in_time) = CURRENT_DATE;
  
  NEW.queue_number := today_count;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_queue_number ON patients;
CREATE TRIGGER set_queue_number
  BEFORE INSERT ON patients
  FOR EACH ROW EXECUTE FUNCTION generate_queue_number();

-- Enable RLS (allowing public access for demo purposes)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE db_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo mode)
CREATE POLICY "Allow public read departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Allow public read doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Allow public all patients" ON patients FOR ALL USING (true);
CREATE POLICY "Allow public all visit_history" ON visit_history FOR ALL USING (true);
CREATE POLICY "Allow public read db_logs" ON db_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert db_logs" ON db_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update doctors" ON doctors FOR UPDATE USING (true);
