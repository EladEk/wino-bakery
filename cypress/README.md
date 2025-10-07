# E2E Tests for Bread Bakery

This directory contains End-to-End (E2E) tests for the Bread Bakery application using Cypress.

## Test Structure

### Test Files

1. **`bread-ordering.cy.js`** - Tests basic bread ordering functionality
   - Display bread list
   - Add/remove bread from order
   - Quantity validation
   - Order button behavior

2. **`club-member.cy.js`** - Tests club member specific functionality
   - General available quantities display
   - No kibbutz allocation info shown
   - Ordering from general quantities

3. **`kibbutz-member.cy.js`** - Tests regular kibbutz member functionality
   - Kibbutz allocation information display
   - Ordering from allocated quantities
   - Allocation limits respect

4. **`admin-functionality.cy.js`** - Tests admin interface functionality
   - Bread management interface
   - Adding/editing breads
   - Kibbutz allocation management
   - Club kibbutz filtering

5. **`integration.cy.js`** - Full integration tests
   - Complete ordering flow
   - Cross-user type validation
   - State management
   - Edge cases handling

## Running Tests

### Prerequisites

1. Make sure the application is running:
   ```bash
   npm start
   ```

2. The application should be accessible at `http://localhost:3000`

### Running Tests

#### Open Cypress Test Runner (Interactive Mode)
```bash
npm run cypress:open
```

#### Run Tests in Headless Mode
```bash
npm run cypress:run
```

#### Run E2E Tests
```bash
npm run e2e
```

## Test Configuration

The tests are configured in `cypress.config.js`:
- Base URL: `http://localhost:3000`
- Viewport: 1280x720
- Video recording: Enabled
- Screenshot on failure: Enabled
- Timeouts: 10 seconds

## Custom Commands

The following custom commands are available in `cypress/support/commands.js`:

- `cy.loginAsUser(email, password)` - Login as regular user
- `cy.loginAsAdmin(email, password)` - Login as admin
- `cy.waitForBreadsToLoad()` - Wait for bread data to load
- `cy.addBreadToOrder(breadName, quantity)` - Add bread to order
- `cy.checkClubMemberStatus()` - Check if user is club member
- `cy.goToAdminPage()` - Navigate to admin page
- `cy.createBread(breadData)` - Create new bread (admin)

## Test Data

Tests use the following assumptions:
- Test users exist in the system
- Bread data is available
- Firebase is properly configured
- Authentication is working

## Notes

- Tests are written in Hebrew where appropriate to match the UI
- Some tests may need adjustment based on actual authentication implementation
- Tests assume certain DOM structure and data-testid attributes
- Club member vs regular kibbutz member logic is tested based on the recent changes

## Troubleshooting

1. **Tests fail to load page**: Make sure the app is running on `http://localhost:3000`
2. **Authentication issues**: Implement proper login commands based on your auth system
3. **Element not found**: Check if data-testid attributes are added to components
4. **Timeout issues**: Increase timeout values in cypress.config.js if needed
