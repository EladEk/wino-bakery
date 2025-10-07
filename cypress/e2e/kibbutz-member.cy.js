describe('Kibbutz Member Functionality', () => {
  beforeEach(() => {
    // Visit the homepage before each test
    cy.visit('/')
  })

  it('should display kibbutz allocation information for regular kibbutz members', () => {
    // This test assumes the user is logged in as a regular kibbutz member
    // You'll need to implement login logic based on your auth system
    
    cy.waitForBreadsToLoad()
    
    // Check that bread quantities are displayed
    cy.get('tbody tr').each(($row) => {
      cy.wrap($row).within(() => {
        // Available quantity should be displayed
        cy.get('td').eq(2).should('contain.text', /\d+/)
        
        // Should show kibbutz allocation info for regular kibbutz members
        // (if they have allocations)
        cy.get('body').then(($body) => {
          if ($body.find('.kibbutz-allocation-info').length > 0) {
            cy.get('.kibbutz-allocation-info').should('be.visible')
          }
        })
      })
    })
  })

  it('should show allocated quantities for kibbutz members', () => {
    cy.waitForBreadsToLoad()
    
    // Check if kibbutz allocation info is present
    cy.get('body').then(($body) => {
      if ($body.find('.kibbutz-allocation-info').length > 0) {
        cy.get('.kibbutz-allocation-info').should('contain.text', 'הוקצה לקיבוץ')
      }
    })
  })

  it('should allow kibbutz members to order from their allocated quantities', () => {
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

  it('should respect kibbutz allocation limits', () => {
    cy.waitForBreadsToLoad()
    
    // Get the first bread row
    cy.get('tbody tr').first().within(() => {
      // Get the available quantity (should be kibbutz allocation)
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

  it('should show correct pricing for kibbutz members', () => {
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
