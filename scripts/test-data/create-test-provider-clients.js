// Script to create test provider clients that match existing case manager clients
// This will demonstrate the connection functionality

const testProviderClients = [
  {
    firstName: "John",
    lastName: "Hey", 
    dateOfBirth: "1990-05-15", // Adding DOB for matching
    status: "ACTIVE_STABLE",
    phone: "1232",
    email: "john.hey@provider.com",
    city: "Minneapolis",
    state: "MN",
    currentProvider: "TestProvider Healthcare",
    caseManagerEmail: "mika.mika@casemanager.com" // This should link to your case manager
  },
  {
    firstName: "Zakaria",
    lastName: "Suleman",
    dateOfBirth: "1985-03-22",
    status: "ACTIVE_STABLE", 
    phone: "12",
    email: "zakaria.suleman@provider.com",
    city: "St. Paul",
    state: "MN",
    currentProvider: "TestProvider Healthcare",
    caseManagerEmail: "mika.mika@casemanager.com"
  },
  {
    firstName: "Mike",
    lastName: "Smith",
    dateOfBirth: "1992-08-10",
    status: "ACTIVE_STABLE",
    phone: "(555) 987-6560",
    email: "jane.smith@email.com", // Using same email as in your screenshot
    city: "Minneapolis", 
    state: "MN",
    currentProvider: "TestProvider Healthcare",
    caseManagerEmail: "mika.mika@casemanager.com"
  },
  {
    firstName: "Yusuf",
    lastName: "Siman",
    dateOfBirth: "1988-12-05",
    status: "ACTIVE_STABLE",
    phone: "(555) 987-6546",
    email: "jane.smith@email.com",
    city: "Minneapolis",
    state: "MN", 
    currentProvider: "TestProvider Healthcare",
    caseManagerEmail: "mika.mika@casemanager.com"
  },
  {
    firstName: "Samira",
    lastName: "Ebada",
    dateOfBirth: "1995-07-18",
    status: "ACTIVE_STABLE",
    phone: "(555) 987-6559",
    email: "jane.smith@email.com",
    city: "Minneapolis",
    state: "MN",
    currentProvider: "TestProvider Healthcare", 
    caseManagerEmail: "mika.mika@casemanager.com"
  }
];

console.log('Test provider clients to import:');
console.log(JSON.stringify({ clients: testProviderClients }, null, 2));

console.log('\nTo import these clients, you would:');
console.log('1. Log in as a provider in your app');
console.log('2. Go to the provider clients page');
console.log('3. Click "Import" and use this data');
console.log('4. Or use the API directly: POST /api/clients/import');
console.log('\nThis will create matching clients that should show "Activate" buttons in your case manager client table!');
