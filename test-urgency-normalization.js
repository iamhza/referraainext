// Test script for urgency normalization
function normalizeUrgency(urgency) {
  const normalized = urgency.toLowerCase();
  if (normalized === 'high' || normalized === 'urgent' || normalized === 'critical' || normalized === 'emergency' || normalized === 'immediate' || normalized === 'asap' || normalized === 'priority') {
    return 'high';
  }
  if (normalized === 'low' || normalized === 'routine' || normalized === 'non-urgent' || normalized === 'nonurgent' || normalized === 'not urgent' || normalized === 'not-urgent') {
    return 'low';
  }
  return 'medium'; // Default to medium for any unrecognized values
}

// Test cases based on the current data
const testCases = [
  'medium',
  'high', 
  'High',
  'Medium',
  'Low',
  'Urgent',
  'urgent',
  'URGENT',
  'Critical',
  'Emergency',
  'Immediate',
  'ASAP',
  'Priority',
  'routine',
  'Routine',
  'non-urgent',
  'Non-urgent',
  'not urgent',
  'Not urgent',
  'unknown',
  'random'
];

console.log('Testing urgency normalization:');
console.log('==============================');

testCases.forEach(testCase => {
  const result = normalizeUrgency(testCase);
  console.log(`${testCase.padEnd(15)} -> ${result}`);
});

console.log('\nExpected results:');
console.log('- All "high" variations should map to "high"');
console.log('- All "medium" variations should map to "medium"'); 
console.log('- All "low" variations should map to "low"');
console.log('- Unknown values should default to "medium"'); 