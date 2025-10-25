// Run this in browser console to clear tour completion flag
console.log('Clearing tour flags...');
localStorage.removeItem('referra-tour-case_manager-completed');
localStorage.removeItem('referra-tour-supervisor-completed');
localStorage.removeItem('referra-tour-org_admin-completed');
console.log('✅ Tour flags cleared! Refresh the page to see the tour.');
