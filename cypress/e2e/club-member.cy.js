describe('Club Member Functionality', () => {
  beforeEach(() => {
    // Visit the homepage before each test
    cy.visit('/')
  })

  it('should display general available quantities for club members', () => {
    // This test assumes the user is logged in as a club member
    // You'll need to implement login logic based on your auth system
    
    cy.waitForBreadsToLoad()
    
    // Check that bread quantities are displayed
    cy.get('tbody tr').each(($row) => {
      cy.wrap($row).within(() => {
        // Available quantity should be displayed
        cy.get('td').eq(2).should('contain.text', /\d+/)
        
        // Should NOT show kibbutz allocation info for club members
        cy.get('.kibbutz-allocation-info').should('not.exist')
      })
    })
  })

  it('should not show kibbutz allocation information for club members', () => {
    cy.waitForBreadsToLoad()
    
    // Club members should not see kibbutz allocation details
    cy.get('.kibbutz-allocation-info').should('not.exist')
  })

  it('should allow club members to order from general quantities', () => {
    cy.waitForBreadsToLoad()
    
    // Get the first bread row
    cy.get('tbody tr').first().within(() => {
      // Check that quantity controls work
      cy.get('button').contains('+').should('be.visible')
      cy.get('button').contains('–').should('be.visible')
      
      // Add bread to order
      cy.get('button').contains('+').click()
      cy.get('input[type="number"]').should('have.value', '1')
    })
  })

  it('should respect available quantity limits for club members', () => {
    cy.waitForBreadsToLoad()
    
    // Get the first bread row
    cy.get('tbody tr').first().within(() => {
      // Get the available quantity
      cy.get('td').eq(2).invoke('text').then((availableText) => {
        const available = parseInt(availableText)
        
        if (available > 0) {
          // Try to add more than available
          for (let i = 0; i < available + 1; i++) {
            cy.get('button').contains('+').click()
          }
          
          // Should not exceed available quantity
          cy.get('input[type="number"]').should('have.value', available.toString())
        }
      })
    })
  })

  it('should show correct pricing for club members', () => {
    cy.waitForBreadsToLoad()
    
    // Check that prices are displayed correctly
    cy.get('tbody tr').each(($row) => {
      cy.wrap($row).within(() => {
        // Price should be displayed
        cy.get('td').eq(3).should('contain.text', '₪')
        
        // Price should be a valid number
        cy.get('td').eq(3).invoke('text').then((priceText) => {
          const price = parseFloat(priceText.replace(/[^\d.]/g, ''))
          expect(price).to.be.a('number')
          expect(price).to.be.greaterThan(0)
        })
      })
    })
  })
})
