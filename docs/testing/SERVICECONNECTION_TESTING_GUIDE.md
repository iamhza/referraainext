# 🧪 ServiceConnection Testing Guide

**Complete step-by-step testing guide for the new PMI-based ServiceConnection system**

---

## 🎯 **Testing Overview**

The ServiceConnection system enables **PMI-based exact matching** between case managers and providers for existing service relationships. This guide provides step-by-step testing scenarios.

### **What You'll Test:**
1. **PMI Matching** - Exact 9-digit PMI client discovery
2. **Connection Flow** - Initiate → Pending → Accept → Workspace
3. **Service Type Tracking** - Correct service type storage and display
4. **Workspace Integration** - ServiceConnection data in enhanced workspace

---

## 🚀 **Test Scenario 1: Basic PMI Connection Flow**

### **Setup:**
1. **Two test accounts:**
   - Case Manager: `cm-test@example.com`
   - Provider: `provider-test@example.com`

2. **Test client data:**
   - PMI: `123456789`
   - Name: `John Doe`
   - DOB: `1985-06-15`
   - Service Type: `Mental Health`

### **Step-by-Step Test:**

#### **Phase 1: Case Manager Adds Client**
1. Login as **Case Manager**
2. Go to **Clients** → **Import** → **Manual Add**
3. Fill in client details:
   ```
   First Name: John
   Last Name: Doe
   Date of Birth: 1985-06-15
   PMI: 123456789
   Primary Service Type: Mental Health
   Current Provider Name: Sunrise Mental Health
   Provider Contact Email: provider-test@example.com
   ```
4. Click **"Check for Connection"** ➜ Should show "No Matches Found"
5. Click **"Add to List"** ➜ Client added successfully

**✅ Verify:** Client appears in table with service type and PMI displayed

#### **Phase 2: Provider Discovers Connection**
1. Login as **Provider**
2. Go to **Clients** → **Import** → **Manual Add**
3. Fill in same client details:
   ```
   First Name: John
   Last Name: Doe
   Date of Birth: 1985-06-15
   PMI: 123456789
   Service Type: Mental Health
   ```
4. Click **"Check for Connection"** ➜ Should show **"Potential Connections Found!"**
5. Review suggested connection showing case manager info
6. Click **"Request Connection"** ➜ Success message displayed

**✅ Verify:** Provider client table shows client with "Pending" status

#### **Phase 3: Case Manager Accepts Connection**
1. Back to **Case Manager** account
2. Go to **Clients** table
3. Find John Doe client ➜ Should show **"Accept Connection"** button
4. Click **"Accept Connection"** ➜ Success message
5. Refresh table ➜ Status changes to **"Connected"**

**✅ Verify:** Both accounts show "Connected" status and "Workspace" button

#### **Phase 4: Test Workspace**
1. From either account, click **"Workspace"** button
2. Workspace opens with ServiceConnection metadata:
   - PMI: 123456789
   - Service Type: Mental Health
   - Connection Type: Existing Service
   - Established Date: [current date]

**✅ Verify:** Workspace displays ServiceConnection information correctly

---

## 🔍 **Test Scenario 2: PMI Validation & Error Handling**

### **Test Invalid PMI:**
1. Try adding client with PMI: `12345` (too short)
   - **Expected:** Error message "Invalid PMI format"
2. Try adding client with PMI: `abcd12345` (contains letters)
   - **Expected:** Error message "Invalid PMI format"
3. Try adding client with PMI: `1234567890` (too long)
   - **Expected:** Error message "Invalid PMI format"

### **Test Missing PMI:**
1. Add client without PMI
   - **Expected:** Error message "PMI is required for HIPAA compliance"

### **Test Duplicate PMI:**
1. Add client with existing PMI
   - **Expected:** Should find existing client and offer connection

---

## 📊 **Test Scenario 3: Service Type Accuracy**

### **Test Service Type Dropdown:**
1. Open Import Modal
2. Click Service Type dropdown
3. **Verify:** Shows categorized services:
   - Non-Residential Services (Mental Health, Physical Therapy, etc.)
   - Residential Services (Group Home, etc.)

### **Test Service Type Storage:**
1. Add client with specific service type
2. Check database or client table
3. **Verify:** Service type correctly stored and displayed

---

## 🛡️ **Test Scenario 4: Security & HIPAA Compliance**

### **Test Encrypted Data:**
1. Check MongoDB directly
2. **Verify:** Client names are encrypted in `pending_connections`
3. **Verify:** PMI data is properly indexed but not exposed in logs

### **Test Role-Based Access:**
1. **Case Manager:** Should only see clients with providers
2. **Provider:** Should only see clients with case managers
3. **Admin:** Should see all (if admin role exists)

### **Test Audit Logging:**
1. Perform connection actions
2. Check audit logs collection
3. **Verify:** All actions logged with proper metadata

---

## 🚨 **Test Scenario 5: Error Recovery**

### **Test Connection Timeout:**
1. Initiate connection but don't accept for 30 days
2. **Verify:** Connection expires automatically

### **Test Duplicate Connections:**
1. Try to initiate same connection twice
2. **Expected:** Error "Connection already exists"

### **Test Missing Client:**
1. Try to connect with PMI that doesn't exist
2. **Expected:** Error "No client found with PMI"

---

## 🎯 **Success Criteria Checklist**

### **✅ PMI Matching:**
- [ ] Exact 9-digit PMI validation works
- [ ] PMI matching finds correct clients
- [ ] Invalid PMI formats rejected
- [ ] Duplicate PMI handling works

### **✅ Connection Flow:**
- [ ] Initiate connection creates pending state
- [ ] Accept connection activates workspace
- [ ] Connection status displayed correctly in table
- [ ] Workspace button appears after activation

### **✅ Service Type Tracking:**
- [ ] Service type dropdown loads correctly
- [ ] Service type stored in client record
- [ ] Service type displayed in client table
- [ ] Service type included in ServiceConnection metadata

### **✅ Security & Compliance:**
- [ ] Client names encrypted in pending_connections
- [ ] Role-based access control working
- [ ] Audit logs capture all actions
- [ ] No PHI exposed in console logs

### **✅ UI/UX:**
- [ ] Success/error messages clear and helpful
- [ ] Table refreshes automatically after actions
- [ ] Recently added clients highlighted
- [ ] Connection status visually clear

---

## 🐛 **Common Issues & Troubleshooting**

### **"Service dropdown loading forever"**
- **Fix:** Check `/api/services` endpoint
- **Verify:** Services collection has correct schema

### **"No matches found" when PMI should match**
- **Fix:** Check client has correct PMI format
- **Verify:** Case manager owns the client with that PMI

### **"Connection request failed"**
- **Fix:** Check browser console for exact error
- **Verify:** Both accounts have clients with same PMI

### **Workspace not loading**
- **Fix:** Verify referral was created with ServiceConnection metadata
- **Check:** Both `pending_connections` and `referrals` collections

---

## 📈 **Performance Testing**

### **Database Performance:**
1. Add 1000+ clients with PMI
2. Test PMI search response time
3. **Target:** < 100ms response time

### **Connection Query Performance:**
1. Create 100+ pending connections
2. Test connections API response time  
3. **Target:** < 500ms response time

---

## 🎓 **Advanced Testing Scenarios**

### **Multiple Providers Per Client:**
1. Add client with 3 different service types
2. Have 3 different providers connect
3. **Verify:** All connections work independently

### **Service Type Mismatch:**
1. Case manager lists "Physical Therapy"
2. Provider tries to connect with "Mental Health"
3. **Expected:** Connection still works (PMI is primary match)

### **Cross-Organization Connections:**
1. Case manager from County A
2. Provider from Organization B
3. **Verify:** Connection works across organizations

---

## 📝 **Test Data Templates**

### **Sample Client Data:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith", 
  "dateOfBirth": "1990-03-20",
  "pmi": "987654321",
  "serviceType": "Occupational Therapy",
  "phone": "(555) 123-4567",
  "email": "jane.smith@email.com"
}
```

### **Sample Provider Organization:**
```json
{
  "name": "Sunrise Therapy Services",
  "email": "contact@sunrise-therapy.com",
  "services": ["Physical Therapy", "Occupational Therapy", "Speech Therapy"]
}
```

---

## 🏁 **Final Validation**

After completing all test scenarios:

1. **Database State:** Check collections for proper data structure
2. **User Experience:** Smooth workflow from discovery to workspace
3. **Data Integrity:** No duplicate connections or orphaned records
4. **Performance:** All operations complete within target timeframes
5. **Security:** No PHI exposed, proper encryption maintained

**🎯 Goal:** Zero false connections, 100% PMI accuracy, seamless user experience

---

**Ready to test? Start with Scenario 1 and work through each phase systematically!** 🚀
