require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");

const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const normalizeEmail = require("./normalizeEmail");

const seedData = async () => {
  try {
    await connectDB();

    console.log("Clearing old seed data...");

    await User.deleteMany({
      email: {
        $in: [
          normalizeEmail("dr.goldstein@oncolog.com"),
          normalizeEmail("noa.lab@oncolog.com"),
          normalizeEmail("sarah.cohen@email.com"),
        ],
      },
    });

    await PatientProfile.deleteMany({
      email: normalizeEmail("sarah.cohen@email.com"),
    });

    console.log("Creating oncologist user...");

    const oncologist = await User.create({
      fullName: "Dr. Miriam Goldstein",
      email: normalizeEmail("dr.goldstein@oncolog.com"),
      password: "onco123",
      role: "oncologist",
    });

    console.log("Creating lab staff user...");

    await User.create({
      fullName: "Noa Ben-David",
      email: normalizeEmail("noa.lab@oncolog.com"),
      password: "lab123",
      role: "lab_staff",
    });

    console.log("Creating demo patient profile...");

    await PatientProfile.create({
      oncologist: oncologist._id,
      createdBy: oncologist._id,
      fullName: "Sarah Cohen",
      email: normalizeEmail("sarah.cohen@email.com"),
      nationalId: "123456789",
      dateOfBirth: new Date("1978-03-14"),
      diagnosis: "Breast Cancer — Stage IIIA",
      bloodType: "A+",
      allergies: [
        {
          name: "Penicillin",
          severity: "severe",
          notes: "Avoid penicillin-based medication",
        },
        {
          name: "Sulfa drugs",
          severity: "moderate",
          notes: "",
        },
      ],
      notes: "Demo patient profile created by seed script.",
      accountStatus: "waiting_for_registration",
      isActive: true,
    });

    console.log("Seed completed successfully");

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

seedData();

//seed for the oncologist and the lab staff (so unauthorized people wont register as an oncologist\lab)
// and sarah so she will be able to register (*might delete later)
