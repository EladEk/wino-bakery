// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to login as a regular user
Cypress.Commands.add('loginAsUser', (email = 'test@example.com', password = 'password123') => {
  cy.visit('/')
  // Add login logic here based on your authentication system
  // This is a placeholder - you'll need to implement based on your auth
})

// Custom command to login as admin
Cypress.Commands.add('loginAsAdmin', (email = 'admin@example.com', password = 'admin123') => {
  cy.visit('/')
  // Add admin login logic here
  // This is a placeholder - you'll need to implement based on your auth
})

// Custom command to wait for bread data to load
Cypress.Commands.add('waitForBreadsToLoad', () => {
  cy.get('[data-testid="bread-table"]', { timeout: 10000 }).should('be.visible')
})

// Custom command to add bread to order
Cypress.Commands.add('addBreadToOrder', (breadName, quantity = 1) => {
  cy.contains('td', breadName)
    .parent('tr')
    .within(() => {
      // Find the quantity input and add the specified quantity
      for (let i = 0; i < quantity; i++) {
        cy.get('button').contains('+').click()
      }
    })
})

// Custom command to check if user is club member
Cypress.Commands.add('checkClubMemberStatus', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="club-member-indicator"]').length > 0) {
      return true
    }
    return false
  })
})

// Custom command to navigate to admin page
Cypress.Commands.add('goToAdminPage', () => {
  cy.visit('/admin')
})

// Custom command to create a new bread (admin only)
Cypress.Commands.add('createBread', (breadData) => {
  cy.get('[data-testid="add-bread-button"]').click()
  cy.get('[data-testid="bread-name-input"]').type(breadData.name)
  cy.get('[data-testid="bread-description-input"]').type(breadData.description)
  cy.get('[data-testid="bread-price-input"]').type(breadData.price)
  cy.get('[data-testid="bread-quantity-input"]').type(breadData.quantity)
  cy.get('[data-testid="save-bread-button"]').click()
})
