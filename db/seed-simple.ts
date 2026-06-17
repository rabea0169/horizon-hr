import { drizzle } from "drizzle-orm/mysql2";
import { createConnection } from "mysql2";
import * as schema from "./schema";

const connection = createConnection(process.env.DATABASE_URL!);
const db = drizzle(connection, { schema, mode: "planetscale" });

async function seed() {
  console.log("Seeding...");

  // Departments
  await db.insert(schema.departments).values([
    { name: "Engineering", description: "Software development", color: "#4A2C3F" },
    { name: "Sales", description: "Sales team", color: "#6B3A5A" },
    { name: "Marketing", description: "Marketing", color: "#8B4870" },
    { name: "Finance", description: "Finance", color: "#AB5680" },
    { name: "HR", description: "Human Resources", color: "#E85D4A" },
  ]);
  console.log("Departments done");

  const depts = await db.select().from(schema.departments);
  const deptIds = depts.map((d) => d.id);

  // Employees
  await db.insert(schema.employees).values([
    { employeeCode: "EMP001", fullName: "Ahmed Hassan", email: "ahmed@hr.com", departmentId: deptIds[0], role: "dev", jobTitle: "Senior Developer", joinDate: new Date("2024-01-15"), salary: "15000", status: "active", employmentType: "full_time" },
    { employeeCode: "EMP002", fullName: "Sara Mahmoud", email: "sara@hr.com", departmentId: deptIds[0], role: "dev", jobTitle: "Frontend Dev", joinDate: new Date("2024-03-01"), salary: "12000", status: "active", employmentType: "full_time" },
    { employeeCode: "EMP003", fullName: "Mohamed Ali", email: "mohamed@hr.com", departmentId: deptIds[1], role: "manager", jobTitle: "Sales Manager", joinDate: new Date("2023-06-20"), salary: "18000", status: "active", employmentType: "full_time" },
    { employeeCode: "EMP004", fullName: "Fatima Zahra", email: "fatima@hr.com", departmentId: deptIds[2], role: "marketing", jobTitle: "Marketing Specialist", joinDate: new Date("2024-02-10"), salary: "11000", status: "active", employmentType: "full_time" },
    { employeeCode: "EMP005", fullName: "Omar Khaled", email: "omar@hr.com", departmentId: deptIds[3], role: "accountant", jobTitle: "Accountant", joinDate: new Date("2023-09-05"), salary: "14000", status: "active", employmentType: "full_time" },
    { employeeCode: "EMP006", fullName: "Nour El-Din", email: "nour@hr.com", departmentId: deptIds[0], role: "devops", jobTitle: "DevOps Engineer", joinDate: new Date("2024-04-12"), salary: "16000", status: "on_leave", employmentType: "full_time" },
    { employeeCode: "EMP007", fullName: "Laila Ahmed", email: "laila@hr.com", departmentId: deptIds[4], role: "hr", jobTitle: "HR Specialist", joinDate: new Date("2024-01-20"), salary: "10000", status: "active", employmentType: "full_time" },
    { employeeCode: "EMP008", fullName: "Youssef Samir", email: "youssef@hr.com", departmentId: deptIds[1], role: "sales", jobTitle: "Sales Rep", joinDate: new Date("2024-05-01"), salary: "9000", status: "active", employmentType: "full_time" },
    { employeeCode: "EMP009", fullName: "Mariam Khaled", email: "mariam@hr.com", departmentId: deptIds[0], role: "backend", jobTitle: "Backend Dev", joinDate: new Date("2024-06-15"), salary: "13000", status: "active", employmentType: "contract" },
    { employeeCode: "EMP010", fullName: "Karim Nabil", email: "karim@hr.com", departmentId: deptIds[2], role: "content", jobTitle: "Content Creator", joinDate: new Date("2024-03-20"), salary: "8500", status: "inactive", employmentType: "part_time" },
  ]);
  console.log("Employees done");

  const emps = await db.select().from(schema.employees);
  const empIds = emps.map((e) => e.id);

  // Attendance
  const today = new Date();
  const statuses = ["present", "present", "present", "late", "absent", "on_leave", "present", "half_day", "present", "present"];
  for (let i = 0; i < empIds.length; i++) {
    await db.insert(schema.attendance).values({
      employeeId: empIds[i],
      date: today,
      status: statuses[i] as "present" | "late" | "absent" | "on_leave" | "half_day",
      checkIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8 + (i % 3), 0),
      checkOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16 + (i % 3), 0),
      hoursWorked: "8",
    });
  }
  console.log("Attendance done");

  // Leaves
  await db.insert(schema.leaves).values([
    { employeeId: empIds[0], leaveType: "annual", startDate: new Date("2026-06-15"), endDate: new Date("2026-06-20"), days: 6, reason: "Family vacation", status: "pending" },
    { employeeId: empIds[2], leaveType: "sick", startDate: new Date("2026-06-10"), endDate: new Date("2026-06-12"), days: 3, reason: "Medical", status: "approved" },
    { employeeId: empIds[4], leaveType: "emergency", startDate: new Date("2026-06-08"), endDate: new Date("2026-06-09"), days: 2, reason: "Emergency", status: "approved" },
    { employeeId: empIds[5], leaveType: "annual", startDate: new Date("2026-06-01"), endDate: new Date("2026-06-14"), days: 14, reason: "Vacation", status: "approved" },
    { employeeId: empIds[7], leaveType: "sick", startDate: new Date("2026-06-12"), endDate: new Date("2026-06-13"), days: 2, reason: "Not well", status: "pending" },
    { employeeId: empIds[1], leaveType: "unpaid", startDate: new Date("2026-06-20"), endDate: new Date("2026-06-25"), days: 6, reason: "Personal", status: "rejected" },
  ]);
  console.log("Leaves done");

  // Performance
  await db.insert(schema.performanceReviews).values([
    { employeeId: empIds[0], reviewerId: empIds[2], period: "Q1-2026", status: "completed", overallRating: 5, communication: 4, teamwork: 5, productivity: 5, punctuality: 4, goals: "Complete project X", comments: "Excellent" },
    { employeeId: empIds[1], reviewerId: empIds[0], period: "Q1-2026", status: "completed", overallRating: 4, communication: 4, teamwork: 4, productivity: 4, punctuality: 5, goals: "Learn React", comments: "Good" },
    { employeeId: empIds[2], reviewerId: empIds[4], period: "Q2-2026", status: "in_progress", overallRating: 4, communication: 5, teamwork: 3, productivity: 4, punctuality: 4, goals: "Sales +20%", comments: "On track" },
    { employeeId: empIds[3], reviewerId: empIds[2], period: "Q2-2026", status: "pending" },
    { employeeId: empIds[4], reviewerId: empIds[0], period: "Q2-2026", status: "pending" },
  ]);
  console.log("Performance done");

  // Jobs
  await db.insert(schema.jobPostings).values([
    { title: "Senior Backend Dev", departmentId: deptIds[0], description: "Experienced backend dev", requirements: "5+ years Node.js", salaryRange: "$80k-$120k", location: "Remote", employmentType: "full_time", status: "open" },
    { title: "Sales Representative", departmentId: deptIds[1], description: "Join sales team", requirements: "2+ years sales", salaryRange: "$50k-$70k", location: "Cairo", employmentType: "full_time", status: "open" },
    { title: "UI/UX Designer", departmentId: deptIds[0], description: "Design interfaces", requirements: "3+ years design", salaryRange: "$60k-$90k", location: "Remote", employmentType: "full_time", status: "open" },
    { title: "Marketing Intern", departmentId: deptIds[2], description: "Learn marketing", requirements: "Studying marketing", salaryRange: "$1k-$2k", location: "Cairo", employmentType: "intern", status: "paused" },
  ]);
  console.log("Jobs done");

  const jobs = await db.select().from(schema.jobPostings);
  const jobIds = jobs.map((j) => j.id);

  // Candidates
  await db.insert(schema.candidates).values([
    { jobPostingId: jobIds[0], fullName: "Ali Hossam", email: "ali@email.com", phone: "+20 111 222 3333", stage: "interview", rating: 4 },
    { jobPostingId: jobIds[0], fullName: "Mona Tarek", email: "mona@email.com", phone: "+20 112 333 4444", stage: "screening", rating: 3 },
    { jobPostingId: jobIds[0], fullName: "Hassan Ibrahim", email: "hassan@email.com", stage: "applied" },
    { jobPostingId: jobIds[1], fullName: "Dina Fouad", email: "dina@email.com", phone: "+20 113 444 5555", stage: "offer", rating: 5 },
    { jobPostingId: jobIds[2], fullName: "Nadia Salah", email: "nadia@email.com", phone: "+20 114 555 6666", stage: "interview", rating: 4 },
  ]);
  console.log("Candidates done");

  // Payroll
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  await db.insert(schema.payrollRecords).values([
    { employeeId: empIds[0], month, basicSalary: "15000", bonus: "2000", deductions: "500", netPay: "16500", status: "processed" },
    { employeeId: empIds[1], month, basicSalary: "12000", bonus: "1000", deductions: "400", netPay: "12600", status: "processed" },
    { employeeId: empIds[2], month, basicSalary: "18000", bonus: "3000", deductions: "600", netPay: "20400", status: "processed" },
    { employeeId: empIds[3], month, basicSalary: "11000", bonus: "500", deductions: "350", netPay: "11150", status: "pending" },
    { employeeId: empIds[4], month, basicSalary: "14000", bonus: "1500", deductions: "450", netPay: "15050", status: "pending" },
    { employeeId: empIds[5], month, basicSalary: "16000", bonus: "0", deductions: "0", netPay: "16000", status: "on_hold" },
    { employeeId: empIds[6], month, basicSalary: "10000", bonus: "800", deductions: "300", netPay: "10500", status: "pending" },
    { employeeId: empIds[7], month, basicSalary: "9000", bonus: "1200", deductions: "250", netPay: "9950", status: "processed" },
  ]);
  console.log("Payroll done");

  console.log("All seeded!");
  connection.end();
}

seed().catch((e) => { console.error(e); connection.end(); process.exit(1); });
