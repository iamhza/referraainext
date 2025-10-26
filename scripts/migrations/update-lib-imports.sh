#!/bin/bash

###############################################################################
# Script: update-lib-imports.sh
# Purpose: Update all imports after lib/ restructuring
# Usage: bash scripts/migrations/update-lib-imports.sh
###############################################################################

echo "🔄 Updating lib/ imports after domain reorganization..."
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for changes
CHANGES=0

# Navigate to project root
cd "$(dirname "$0")/../.." || exit

##############################################################################
# AUTH IMPORTS
##############################################################################
echo "${YELLOW}📁 Updating auth imports...${NC}"

find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from '@/lib/api-auth'|from '@/lib/auth/api-auth'|g" \
  -e "s|from '@/lib/auth-middleware'|from '@/lib/auth/auth-middleware'|g" \
  -e "s|from '@/lib/auth-minimal'|from '@/lib/auth/auth-minimal'|g" \
  -e "s|from '@/lib/custom-auth'|from '@/lib/auth/custom'|g" \
  -e "s|from '@/lib/nextauth-helpers'|from '@/lib/auth/helpers'|g" \
  -e "s|from '@/lib/auth'|from '@/lib/auth/auth'|g" \
  {} +

echo "${GREEN}✅ Auth imports updated${NC}"
((CHANGES++))

##############################################################################
# CLIENT IMPORTS
##############################################################################
echo "${YELLOW}📁 Updating client imports...${NC}"

find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from '@/lib/client-data-enhancer'|from '@/lib/clients/enhancer'|g" \
  -e "s|from '@/lib/client-matching'|from '@/lib/clients/matching'|g" \
  -e "s|from '@/lib/client-v1.1-adapter'|from '@/lib/clients/adapter'|g" \
  -e "s|from '@/lib/secure-client'|from '@/lib/clients/secure'|g" \
  {} +

echo "${GREEN}✅ Client imports updated${NC}"
((CHANGES++))

##############################################################################
# SERVICE IMPORTS
##############################################################################
echo "${YELLOW}📁 Updating service imports...${NC}"

find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from '@/lib/smart-status-computer'|from '@/lib/services/status-computer'|g" \
  -e "s|from '@/lib/secure-messaging'|from '@/lib/services/messaging'|g" \
  -e "s|from '@/lib/secure-actions'|from '@/lib/services/actions'|g" \
  -e "s|from '@/lib/secure-action-comments'|from '@/lib/services/action-comments'|g" \
  {} +

echo "${GREEN}✅ Service imports updated${NC}"
((CHANGES++))

##############################################################################
# AUDIT IMPORTS
##############################################################################
echo "${YELLOW}📁 Updating audit imports...${NC}"

find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from '@/lib/audit-logger'|from '@/lib/audit/logger'|g" \
  -e "s|from '@/lib/hipaa-audit'|from '@/lib/audit/hipaa'|g" \
  -e "s|from '@/lib/audit'|from '@/lib/audit/utils'|g" \
  {} +

echo "${GREEN}✅ Audit imports updated${NC}"
((CHANGES++))

##############################################################################
# MONGODB IMPORTS
##############################################################################
echo "${YELLOW}📁 Updating MongoDB imports...${NC}"

find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from '@/lib/mongodb'|from '@/lib/mongodb/client'|g" \
  -e "s|from '@/lib/init-mongodb'|from '@/lib/mongodb/init'|g" \
  -e "s|from '@/lib/mongodb-nextauth-adapter'|from '@/lib/mongodb/nextauth-adapter'|g" \
  {} +

echo "${GREEN}✅ MongoDB imports updated${NC}"
((CHANGES++))

##############################################################################
# ORGANIZATION & INVITATION IMPORTS
##############################################################################
echo "${YELLOW}📁 Updating organization & invitation imports...${NC}"

find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from '@/lib/organization'|from '@/lib/organizations/utils'|g" \
  -e "s|from '@/lib/invitations'|from '@/lib/invitations/utils'|g" \
  {} +

echo "${GREEN}✅ Organization & invitation imports updated${NC}"
((CHANGES++))

##############################################################################
# SHARED UTILITY IMPORTS
##############################################################################
echo "${YELLOW}📁 Updating shared utility imports...${NC}"

find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from '@/lib/date-utils'|from '@/lib/shared/date-utils'|g" \
  -e "s|from '@/lib/encryption'|from '@/lib/shared/encryption'|g" \
  -e "s|from '@/lib/formatting'|from '@/lib/shared/formatting'|g" \
  -e "s|from '@/lib/logger'|from '@/lib/shared/logger'|g" \
  -e "s|from '@/lib/rate-limit'|from '@/lib/shared/rate-limit'|g" \
  -e "s|from '@/lib/scoring'|from '@/lib/shared/scoring'|g" \
  -e "s|from '@/lib/server-utils'|from '@/lib/shared/server-utils'|g" \
  -e "s|from '@/lib/themes'|from '@/lib/shared/themes'|g" \
  -e "s|from '@/lib/brand-colors'|from '@/lib/shared/brand-colors'|g" \
  -e "s|from '@/lib/validation'|from '@/lib/shared/validation'|g" \
  -e "s|from '@/lib/email'|from '@/lib/shared/email'|g" \
  -e "s|from '@/lib/supabase-quota'|from '@/lib/shared/quota'|g" \
  {} +

echo "${GREEN}✅ Shared utility imports updated${NC}"
((CHANGES++))

##############################################################################
# UPDATE SCRIPTS DIRECTORY
##############################################################################
echo "${YELLOW}📁 Updating scripts directory imports...${NC}"

find scripts -type f -name "*.js" -exec sed -i '' \
  -e "s|require('../lib/mongodb')|require('../lib/mongodb/client')|g" \
  -e "s|require('./lib/mongodb')|require('./lib/mongodb/client')|g" \
  {} + 2>/dev/null

echo "${GREEN}✅ Script imports updated${NC}"
((CHANGES++))

##############################################################################
# SUMMARY
##############################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "${GREEN}✨ Import migration complete!${NC}"
echo ""
echo "📊 Updated ${CHANGES} categories of imports"
echo ""
echo "🔍 Next steps:"
echo "  1. Run: npm run build (check for TypeScript errors)"
echo "  2. Run: npm run dev (test locally)"
echo "  3. Fix any remaining import issues manually"
echo "  4. Commit with: git add . && git commit -m 'refactor: organize lib/ by domain'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

