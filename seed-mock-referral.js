const { MongoClient } = require('mongodb');

// TODO: Replace with your Atlas connection string and database name
const uri = "mongodb+srv://referra-app:Wazupp8037@clusterdev.m3vpezp.mongodb.net/?retryWrites=true&w=majority&appName=ClusterDev";
const dbName = "referradb";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const referrals = db.collection('referrals');

    // TODO: Replace with your actual case manager user ID
    const caseManagerId = "86f3d3d9-0dfe-432e-9180-e9d3e6795942";

    const mockReferral = {
      clientInfo: {
        firstName: "Testy",
        lastName: "McTestface",
        dateOfBirth: "1990-01-01",
        email: "testy@example.com",
        phone: "555-1234",
        address: {
          street: "123 Main St",
          city: "Testville",
          state: "TS",
          zipCode: "12345"
        },
        preferredContactMethod: "email",
        insurance: {
          type: "Test Insurance"
        }
      },
      serviceDetails: {
        type: "Speech Therapy",
        urgency: "medium",
        counties: ["Hennepin"],
        additionalNotes: "Referral for provider selection UI test"
      },
      caseManagerId,
      status: "provider_selection_required",
      matchedProviders: [
        {
          id: "provider1",
          name: "Dr. Sarah Wilson",
          organization: "Wellness Center",
          matchScore: 95,
          distance: "2.3 miles",
          availability: "High",
          waitTime: "1-2 days",
          phone: "555-1234",
          email: "sarah@wellness.com",
          address: "123 Main St, City, State",
          rating: "4.9",
          specialty: "Mental Health",
          acceptedInsurance: ["Medicaid", "Private"],
          languages: ["English", "Spanish"]
        },
        {
          id: "provider2",
          name: "Dr. Robert Chen",
          organization: "Hope Clinic",
          matchScore: 89,
          distance: "3.1 miles",
          availability: "Medium",
          waitTime: "3-5 days",
          phone: "555-5678",
          email: "robert@hopeclinic.com",
          address: "456 Hope Ave, City, State",
          rating: "4.7",
          specialty: "Speech Therapy",
          acceptedInsurance: ["Medicaid", "Medicare"],
          languages: ["English", "Mandarin"]
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await referrals.insertOne(mockReferral);
    console.log("Inserted referral with _id:", result.insertedId);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run(); 