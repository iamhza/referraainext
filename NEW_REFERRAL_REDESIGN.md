# Referra New Referral Page - Surfe-Inspired Redesign

## 📋 Project Overview
Redesigning the `/case-manager/new-referral` page to match Surfe's clean, modern onboarding aesthetic while maintaining Referra's functionality and brand identity.

## 🎨 Design Requirements

### **Brand Colors**
- **Background**: `#ffffff` (White)
- **Main Text**: `#000000` (Black)
- **Primary Accent**: `#4481eb` (Blue)
- **Secondary Accent**: `#05befe` (Teal)

### **Typography**
- **Font**: Inter or similar clean sans-serif system font
- **Heading Style**: Subheadings with referral-relevant taglines
- **Style**: Clean, minimal, spacious like Surfe

## 🏗️ Layout & Structure

### **Overall Layout**
- ✅ **Keep 3-step wizard approach**
- ✅ **Center-aligned layout** (entire form centered on page)
- ✅ **Spacious, open design** (remove card backgrounds)
- ✅ **Clean, floating form fields** on background

### **Step Navigation**
- ✅ **Step Indicators**: Numbered circles (1, 2, 3) with step names
- ✅ **Navigation Buttons**: Continue/Previous (not Send/Skip)
- ✅ **Step Names**: "Client Info", "Service Details", "Preferences"

### **Visual Elements**
- ✅ **Illustrations**: Abstract/geometric shapes (simple, clean)
- ✅ **No card containers** (remove current card backgrounds)
- ✅ **Center-aligned content** within container

## 🎯 Form Interaction & Features

### **Keep Current Features**
- ✅ **3-step wizard flow**
- ✅ **Current input types** (text, select, radio, checkbox, etc.)
- ✅ **AI Assistant branding** (pause development, keep existing)
- ✅ **Client prefill functionality** (`?clientId=xxx`)
- ✅ **Form validation and error handling**
- ✅ **Animations and transitions**

### **Update to Surfe Style**
- ✅ **Input Styling**: Clean, minimal borders, good spacing
- ✅ **Checkbox/Radio styling**: Match Surfe's clean aesthetic
- ✅ **Button styling**: Use Referra colors with Surfe's clean design
- ✅ **Typography hierarchy**: Large subheadings with descriptive taglines

## 📱 Current Form Structure

### **Step 1: Client Information**
- First Name, Last Name, Date of Birth
- Email, Phone Number
- Address fields (street, city, state, zip)
- Preferred contact method
- **Tagline**: *"Let's start with your client's basic information"*

### **Step 2: Service Details**
- Service type selection (from API)
- Urgency level (Low/Medium/High)
- Preferred start date (calendar picker)
- Counties selection
- Additional notes
- **Tagline**: *"Tell us about the service they need"*

### **Step 3: Provider Preferences**
- Provider type preferences
- Insurance accepted (multiple checkboxes)
- Languages available
- Best times for service
- Emergency services needed
- Show available providers option
- **Tagline**: *"Help us find the perfect provider match"*

## 🔧 Technical Implementation

### **File Locations**
- **Main Page**: `src/app/case-manager/new-referral/page.tsx`
- **Core Component**: `src/components/referrals/ReferralForm.tsx` (1,139 lines)
- **Layout Wrapper**: `src/components/templates/page-template.tsx`

### **Key Features to Maintain**
- Server-side authentication & role verification
- Framer Motion animations
- Real-time form validation
- API integration (`/api/services`, `/api/referrals`, `/api/clients`)
- Confetti celebration on success
- Loading states and error handling

### **Design Changes to Implement**
1. **Remove card containers** and use open layout
2. **Update color scheme** to Referra brand colors
3. **Redesign step indicators** with numbered circles
4. **Restyle all inputs** to match Surfe's clean aesthetic
5. **Add center-aligned layout** with proper spacing
6. **Create abstract illustrations** for visual interest
7. **Update typography** with relevant taglines for each step

## 🎨 Visual Design Elements

### **Step Indicators**
```
○ 1 ——— ○ 2 ——— ○ 3
Client Info   Service Details   Preferences
```

### **Color Usage**
- **Buttons**: Primary blue (`#4481eb`) with white text
- **Accents**: Teal (`#05befe`) for highlights and icons
- **Text**: Black (`#000000`) on white (`#ffffff`) background
- **Form borders**: Light gray with blue focus states

### **Spacing & Layout**
- **Container**: Max-width with center alignment
- **Form fields**: Generous padding and margin
- **Typography**: Clear hierarchy with ample line spacing
- **Illustrations**: Subtle, non-distracting abstract shapes

## 🚀 Implementation Priority

### **Phase 1: Core Layout**
1. Update overall container and background
2. Implement step indicators
3. Remove card backgrounds
4. Center-align content

### **Phase 2: Form Styling**
1. Restyle all input components
2. Update button designs
3. Apply Referra color scheme
4. Add proper typography

### **Phase 3: Visual Polish**
1. Add abstract illustrations
2. Fine-tune spacing and animations
3. Test responsive design
4. Optimize user experience

## 📝 Notes
- **AI Assistant**: Keeping current implementation, will enhance later
- **Form Fields**: Maintaining current input types and validation
- **Functionality**: No changes to core referral submission logic
- **Responsive**: Ensure design works on mobile and desktop
- **Accessibility**: Maintain current accessibility standards

This redesign will transform the referral form into a modern, clean interface that matches Surfe's aesthetic while preserving all of Referra's functionality and brand identity. 