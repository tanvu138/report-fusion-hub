# WORKSTREAM-VERTICAL-NAVIGATION.md
_Created: 2025-07-02_
_Status: ASSIGNED_
_Engineer: AI Engineer (Task)_
_Branch: feature/vertical-navigation-system_

> **Major Feature Implementation**: Global admin-controlled vertical navigation system
> **Complexity**: High (Full-stack with database changes)
> **Estimated Effort**: 6-8 hours
> **Priority**: High

---

## Assignment Summary

**Objective**: Implement a complete vertical navigation system that can be controlled globally by admin users, affecting all users in the application.

**Key Requirements**:
- Global admin control (not per-user preference)
- Database-backed settings storage
- Backward compatibility with current horizontal navigation
- Full accessibility compliance (WCAG 2.1 AA)
- Error resilience with proper fallbacks

---

## Work Assignment

### Primary Task
Implement the complete vertical navigation system as specified in `ARCHITECTURE-VERTICAL-NAVIGATION.md`

### Deliverables Required

#### 1. Database Layer
- [ ] Add `GlobalSetting` model to Prisma schema
- [ ] Create and run database migration
- [ ] Seed initial navigation setting (`horizontal` as default)

#### 2. Backend Implementation  
- [ ] Create `/api/admin/settings` API endpoints
- [ ] Implement role-based access control (secretary only)
- [ ] Add proper error handling and validation
- [ ] Register routes in main app

#### 3. Frontend Core Components
- [ ] Build `GlobalSettingsContext` for app-wide settings
- [ ] Implement `globalSettings.ts` utility functions
- [ ] Create `AppSidebar` component with full navigation
- [ ] Update `MainLayout` to conditionally render navigation types

#### 4. Admin Interface
- [ ] Build `NavigationSettings` admin component
- [ ] Create dedicated admin page or integrate with existing settings
- [ ] Add navigation link in admin menu
- [ ] Implement proper role-based route protection

#### 5. Accessibility Features
- [ ] Add skip links for keyboard navigation
- [ ] Implement proper ARIA landmarks and labels
- [ ] Add focus management and announcements
- [ ] Test with screen readers
- [ ] Ensure high contrast mode compatibility

#### 6. Error Boundaries & Resilience
- [ ] Wrap sidebar with error boundary
- [ ] Create fallback UI for navigation errors
- [ ] Ensure graceful degradation to horizontal navigation
- [ ] Handle API failures appropriately

#### 7. Styling & UX
- [ ] Add smooth transitions and animations
- [ ] Implement tooltips for collapsed sidebar states
- [ ] Add keyboard shortcut indicator (⌘B/Ctrl+B)
- [ ] Ensure responsive mobile behavior

#### 8. Testing & Validation
- [ ] Test all navigation functionality
- [ ] Verify admin role restrictions
- [ ] Test accessibility with keyboard navigation
- [ ] Validate error boundary behavior
- [ ] Test mobile responsiveness

---

## Technical Specifications

### Architecture Reference
**Primary Documentation**: `.labs/ARCHITECTURE-VERTICAL-NAVIGATION.md`
- Complete implementation guide with code examples
- Full API specifications
- Database schema details
- Step-by-step implementation instructions

### Key Implementation Details

#### Database Schema
```sql
-- New table for global settings
CREATE TABLE "global_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id")
);
```

#### API Endpoints
- `GET /api/admin/settings/:key` - Fetch global setting
- `PUT /api/admin/settings/:key` - Update global setting
- `GET /api/admin/settings` - List all settings

#### Component Hierarchy
```
App (wrapped with GlobalSettingsProvider)
├── MainLayout (conditional rendering based on global setting)
│   ├── AppHeader (horizontal navigation - fallback)
│   └── AppSidebar (vertical navigation - new)
└── Admin Pages
    └── NavigationSettings (admin control interface)
```

### Technology Stack
- **Frontend**: React 18, TypeScript, shadcn/ui Sidebar components
- **Backend**: Express.js, Prisma ORM
- **Database**: PostgreSQL with new `global_settings` table
- **Authentication**: Existing JWT system with role validation

---

## Implementation Guidelines

### Development Approach
1. **Start with Backend**: Database migration and API endpoints
2. **Build Core Frontend**: Context and utility functions
3. **Implement Components**: Sidebar and admin interface
4. **Add Accessibility**: Skip links, ARIA, focus management
5. **Error Handling**: Boundaries and fallbacks
6. **Polish UX**: Animations, transitions, responsive design

### Code Quality Standards
- **TypeScript**: Strict typing for all new code
- **Accessibility**: WCAG 2.1 AA compliance required
- **Error Handling**: Comprehensive try-catch and fallbacks
- **Testing**: Manual testing checklist completion required
- **Performance**: No bundle size impact, maintain current speed

### Security Considerations
- **Role Validation**: Only secretary role can modify global settings
- **Input Validation**: Sanitize all user inputs
- **Error Messages**: Don't expose internal system details
- **Audit Trail**: Track who makes changes to global settings

---

## Success Criteria

### Functional Requirements
- [ ] Admin can toggle navigation type for all users
- [ ] Setting persists in database and applies globally
- [ ] Vertical navigation provides more screen real estate
- [ ] All existing navigation functionality preserved
- [ ] Mobile navigation works correctly (sheet overlay)

### Non-Functional Requirements  
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Graceful error handling with fallbacks
- [ ] No performance regression
- [ ] Responsive design on all screen sizes
- [ ] Smooth animations (but respect reduced motion preferences)

### User Experience Goals
- [ ] Intuitive admin interface with clear descriptions
- [ ] Immediate visual feedback during changes
- [ ] Keyboard navigation support throughout
- [ ] Screen reader compatibility
- [ ] Professional, polished visual design

---

## Testing Requirements

### Manual Testing Checklist
- [ ] **Admin Access**: Only secretary role can access navigation settings
- [ ] **Global Control**: Changes affect all users immediately
- [ ] **Navigation Functionality**: All links and features work in both modes
- [ ] **Error Scenarios**: Test API failures and recovery
- [ ] **Accessibility**: Keyboard navigation and screen reader testing
- [ ] **Responsive**: Mobile and tablet compatibility
- [ ] **Cross-Browser**: Chrome, Edge, Safari testing

### Edge Cases to Test
- [ ] **API Unavailable**: Graceful fallback to horizontal navigation
- [ ] **Invalid Data**: Handle corrupted settings gracefully
- [ ] **Network Issues**: Proper error messaging
- [ ] **Concurrent Users**: Multiple admins changing settings
- [ ] **Browser Compatibility**: Modern browser support

---

## Rollout Strategy

### Phase 1: Implementation & Testing
- Complete all development work
- Thorough testing on feature branch
- Accessibility audit completion
- Code review and refinement

### Phase 2: Admin Preview
- Deploy to staging with admin access only
- Admin team testing and feedback
- Bug fixes and polish iterations
- Final approval for production deployment

### Phase 3: Production Deployment
- Deploy with navigation defaulted to horizontal
- Admin can enable vertical navigation when ready
- Monitor for issues and user feedback
- Document any deployment considerations

---

## Important Notes

### Branch Management
- **Current Branch**: `feature/vertical-navigation-system`
- **Base Branch**: `main` 
- **Merge Strategy**: Create PR when implementation complete

### Documentation Updates
- Update `CLAUDE.md` with new navigation commands
- Document admin interface in user guides
- Update architecture documentation if needed

### Communication
- Notify when implementation phases complete
- Report any blockers or architectural concerns
- Document any deviations from the original plan

---

## Engineer Instructions

1. **Read Architecture Document**: Thoroughly review `ARCHITECTURE-VERTICAL-NAVIGATION.md`
2. **Follow Implementation Steps**: Use the detailed step-by-step guide
3. **Use Provided Code**: Leverage the complete code examples provided
4. **Test Thoroughly**: Complete all manual testing requirements
5. **Ask Questions**: Clarify any unclear requirements before proceeding

**Estimated Timeline**: 6-8 hours for complete implementation
**Expected Completion**: End of current work session

The architectural plan provides everything needed for implementation. Focus on code quality, accessibility, and user experience.

---

## Success Definition

The implementation will be considered successful when:
1. Admin can control navigation globally via clean interface
2. All users see the selected navigation type immediately  
3. Accessibility requirements are fully met
4. Error handling provides graceful fallbacks
5. No functionality is lost in the migration
6. Professional UX with smooth transitions

This is a significant feature that will improve the user experience for all report viewers and editors. Execute with attention to detail and user needs.