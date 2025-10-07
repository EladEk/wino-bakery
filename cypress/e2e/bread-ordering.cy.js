describe('Bread Ordering Flow', () => {
  beforeEach(() => {
    // Visit the homepage before each test
    cy.visit('/')
  })

  it('should display bread list for regular users', () => {
    // Check if bread table is visible
    cy.get('table').should('be.visible')
    
    // Check if bread items are displayed
    cy.get('tbody tr').should('have.length.greaterThan', 0)
    
    // Check if quantity controls are present
    cy.get('button').contains('+').should('be.visible')
    cy.get('button').contains('–').should('be.visible')
  })

  it('should allow adding bread to order', () => {
    // Wait for breads to load
    cy.waitForBreadsToLoad()
    
    // Get the first bread row
    cy.get('tbody tr').first().within(() => {
      // Check initial quantity is 0
      cy.get('input[type="number"]').should('have.value', '0')
      
      // Add 2 pieces
      cy.get('button').contains('+').click()
      cy.get('button').contains('+').click()
      
      // Verify quantity is now 2
      cy.get('input[type="number"]').should('have.value', '2')
    })
  })

  it('should allow removing bread from order', () => {
    cy.waitForBreadsToLoad()
    
    // Get the first bread row
    cy.get('tbody tr').first().within(() => {
      // Add 2 pieces first
      cy.get('button').contains('+').click()
      cy.get('button').contains('+').click()
      cy.get('input[type="number"]').should('have.value', '2')
      
      // Remove 1 piece
      cy.get('button').contains('–').click()
      
      // Verify quantity is now 1
      cy.get('input[type="number"]').should('have.value', '1')
    })
  })

  it('should not allow negative quantities', () => {
    cy.waitForBreadsToLoad()
    
    // Get the first bread row
    cy.get('tbody tr').first().within(() => {
      // Try to remove when quantity is 0
      cy.get('button').contains('–').should('be.disabled')
      
      // Add 1 piece
      cy.get('button').contains('+').click()
      cy.get('input[type="number"]').should('have.value', '1')
      
      // Remove 1 piece
      cy.get('button').contains('–').click()
      cy.get('input[type="number"]').should('have.value', '0')
      
      // Minus button should be disabled again
      cy.get('button').contains('–').should('be.disabled')
    })
  })

  it('should display order button when items are added', () => {
    cy.waitForBreadsToLoad()
    
    // Initially, order button might not be visible or enabled
    cy.get('button').contains('הזמן').should('exist')
    
    // Add bread to order
    cy.get('tbody tr').first().within(() => {
      cy.get('button').contains('+').click()
    })
    
    // Order button should be enabled
    cy.get('button').contains('הזמן').should('be.visible')
  })

  it('should show bread details correctly', () => {
    cy.waitForBreadsToLoad()
    
    // Check that bread information is displayed
    cy.get('tbody tr').first().within(() => {
      // Check bread name
      cy.get('td').first().should('not.be.empty')
      
      // Check description
      cy.get('td').eq(1).should('not.be.empty')
      
      // Check available quantity
      cy.get('td').eq(2).should('contain.text', /\d+/)
      
      // Check price
      cy.get('td').eq(3).should('contain.text', '₪')
    })
  })
})
