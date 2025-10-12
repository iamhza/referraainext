# Tasks Directory

This directory contains Product Requirements Documents (PRDs) and their associated task lists for all features in the Referra platform.

## 📁 File Structure

```
tasks/
├── README.md                           # This file
├── 0001-prd-[feature-name].md         # PRD for feature #1
├── tasks-0001-prd-[feature-name].md   # Task list for feature #1
├── 0002-prd-[feature-name].md         # PRD for feature #2
├── tasks-0002-prd-[feature-name].md   # Task list for feature #2
└── ...
```

## 🎯 Workflow Overview

### Step 1: Create PRD
```
Use @ai-dev-tasks/create-prd.md

Feature description: [Your feature description]

Reference files:
@src/app/relevant/file.tsx
@src/lib/relevant/util.ts
```

This will create: `tasks/[n]-prd-[feature-name].md`

### Step 2: Generate Tasks
```
Now take @tasks/[n]-prd-[feature-name].md and create tasks using @ai-dev-tasks/generate-tasks.md
```

This will create: `tasks/tasks-[n]-prd-[feature-name].md`

### Step 3: Execute Tasks
```
Please start on task 1.1 and use @ai-dev-tasks/process-task-list.md
```

The AI will:
- Implement one sub-task at a time
- Wait for your approval before proceeding
- Mark tasks complete as they're finished
- Commit after each parent task completion

## 📋 Current Features

### In Progress
_List features currently being developed_

### Completed
_List completed features_

### Planned
_List upcoming features_

## 🔍 Finding Information

### To find a specific feature:
```bash
# Search PRD titles
grep -r "^# " tasks/*.md

# Search by keyword
grep -ri "keyword" tasks/
```

### To see all incomplete tasks:
```bash
grep -r "\- \[ \]" tasks/tasks-*.md
```

### To see completed tasks:
```bash
grep -r "\- \[x\]" tasks/tasks-*.md
```

## 📝 Naming Conventions

### PRD Files
Format: `[n]-prd-[feature-name].md`
- `n`: 4-digit zero-padded sequence (0001, 0002, ...)
- `feature-name`: kebab-case description

Examples:
- `0001-prd-client-document-upload.md`
- `0002-prd-provider-search-filters.md`
- `0023-prd-bulk-referral-import.md`

### Task List Files
Format: `tasks-[n]-prd-[feature-name].md`

Must match the corresponding PRD filename with `tasks-` prefix.

Examples:
- `tasks-0001-prd-client-document-upload.md`
- `tasks-0002-prd-provider-search-filters.md`
- `tasks-0023-prd-bulk-referral-import.md`

## 🎨 PRD Template

Every PRD should include:

1. **Introduction/Overview**
   - What problem does this solve?
   - Who is it for?

2. **Goals**
   - Specific, measurable objectives

3. **User Stories**
   - As a [role], I want to [action] so that [benefit]

4. **Functional Requirements**
   - Numbered list of specific requirements

5. **Non-Goals**
   - What this feature will NOT include

6. **Design Considerations**
   - UI/UX requirements
   - Mockups or wireframes

7. **Technical Considerations**
   - Integration points
   - Performance requirements
   - Security requirements

8. **Success Metrics**
   - How will success be measured?

9. **Open Questions**
   - What needs clarification?

## ✅ Task List Template

Every task list should include:

```markdown
## Relevant Files

- `path/to/file.ts` - Description of file
- `path/to/file.test.ts` - Tests for file

## Tasks

- [ ] 1.0 Parent Task Title
  - [ ] 1.1 Sub-task description
  - [ ] 1.2 Sub-task description
- [ ] 2.0 Parent Task Title
  - [ ] 2.1 Sub-task description
```

## 🔒 Security Checklist

For every feature, verify:

- [ ] Authentication required
- [ ] User's organization verified
- [ ] Role-based permissions checked
- [ ] RLS policies prevent cross-org access
- [ ] All inputs validated
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Sensitive data encrypted

## 🧪 Testing Checklist

For every feature, test:

- [ ] Happy path user flow
- [ ] Validation errors
- [ ] Permission checks
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility
- [ ] Accessibility (keyboard, screen reader)

## 📚 Resources

- **Main Rules**: See `.cursorrules` in project root
- **Platform Overview**: See `COMPLETE_PLATFORM_OVERVIEW.md`
- **User Flows**: See `FINALIZED_USER_FLOWS.md`
- **Testing Guide**: See `COMPREHENSIVE_QA_TESTING.md`

## 🎯 Best Practices

1. **Always start with a PRD** for any significant feature
2. **Break down complex features** into smaller, manageable tasks
3. **Review each sub-task** before approving
4. **Test thoroughly** before marking complete
5. **Update documentation** as you go
6. **Commit frequently** after each parent task
7. **Ask questions** when requirements are unclear

## 🚀 Next Steps

1. Identify the next feature to build
2. Create a PRD using the workflow above
3. Generate tasks from the PRD
4. Execute tasks one at a time
5. Test, review, and deploy

---

**Remember**: This structured approach ensures high-quality, production-ready code. Take your time, follow the process, and build something great! 🎉



