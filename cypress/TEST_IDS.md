# Test IDs Reference

This document lists all the `data-testid` attributes added to the application for E2E testing.

## Home Page Components

### CustomerBreadsTable
- `bread-table` - Main bread table
- `quantity-control-{breadId}` - Quantity control for specific bread

### OrderQuantityControl
- Inherits testid from parent component

### NamePrompt
- `save-profile-button` - Save profile button

### HomePage
- `order-button` - Place order button
- `update-order-button` - Update existing order button

## Header Component

- `logout-button` - Logout button
- `kibbutz-button` - Join/Manage kibbutz button
- `install-app-button` - Install app button
- `admin-panel-button` - Admin panel button
- `back-home-button` - Back to home button
- `back-to-admin-button` - Back to admin button

## Admin Page Components

### AdminPage
- `toast-close-button` - Close toast notification
- `end-sale-button` - End sale button
- `add-bread-button` - Add new bread button
- `close-add-bread-button` - Close add bread modal

### AdminAddBreadForm
- `submit-add-bread-button` - Submit add bread form

### BreadEditModal
- `close-modal-button` - Close modal button
- `save-bread-button` - Save bread changes
- `cancel-edit-bread-button` - Cancel edit bread
- `delete-bread-button` - Delete bread

### BreadTable
- `edit-bread-button-{breadId}` - Edit specific bread

### AdminNavigation
- `admin-nav-{key}` - Navigation buttons (e.g., `admin-nav-orders`, `admin-nav-users`)

## Kibbutz Components

### KibbutzModal
- `close-kibbutz-modal-button` - Close kibbutz modal
- `update-orders-button` - Update existing orders
- `leave-kibbutz-button` - Leave kibbutz
- `join-kibbutz-button` - Join kibbutz

### KibbutzPasswordModal
- `close-password-modal-button` - Close password modal
- `submit-password-button` - Submit password
- `cancel-password-button` - Cancel password entry

## Usage in Tests

### Example: Testing bread ordering
```javascript
// Add bread to order
cy.get('[data-testid="quantity-control-bread123"]')
  .within(() => {
    cy.get('button').contains('+').click()
  })

// Place order
cy.get('[data-testid="order-button"]').click()
```

### Example: Testing admin functionality
```javascript
// Add new bread
cy.get('[data-testid="add-bread-button"]').click()
cy.get('[data-testid="bread-name-input"]').type('New Bread')
cy.get('[data-testid="submit-add-bread-button"]').click()
```

### Example: Testing kibbutz functionality
```javascript
// Join kibbutz
cy.get('[data-testid="kibbutz-button"]').click()
cy.get('[data-testid="join-kibbutz-button"]').click()
```

## Notes

- All test IDs follow kebab-case naming convention
- Test IDs are descriptive and indicate the component and action
- Dynamic test IDs include the relevant ID (e.g., bread ID, user ID)
- Test IDs are consistent across similar components
- All buttons in the system now have test IDs for reliable E2E testing
