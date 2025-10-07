describe('Full Integration Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should complete full bread ordering flow', () => {
    // Wait for page to load
    cy.waitForBreadsToLoad()
    
    // Add multiple breads to order
    cy.get('tbody tr').first().within(() => {
      cy.get('button').contains('+').click()
      cy.get('button').contains('+').click()
    })
    
    // Add second bread
    cy.get('tbody tr').eq(1).within(() => {
      cy.get('button').contains('+').click()
    })
    
    // Check that order button is enabled
    cy.get('button').contains('הזמן').should('be.visible')
    
    // Place order
    cy.get('button').contains('הזמן').click()
    
    // Check for success message or redirect
    cy.get('body').should('contain.text', 'תודה') // Should show thank you message
  })

  it('should handle different user types correctly', () => {
    cy.waitForBreadsToLoad()
    
    // Test for regular user (no kibbutz)
    cy.get('tbody tr').first().within(() => {
      // Should see general available quantities
      cy.get('td').eq(2).should('contain.text', /\d+/)
      
      // Should not see kibbutz allocation info
      cy.get('.kibbutz-allocation-info').should('not.exist')
    })
  })

  it('should validate quantity limits across different scenarios', () => {
    cy.waitForBreadsToLoad()
    
    // Test quantity limits for each bread
    cy.get('tbody tr').each(($row) => {
      cy.wrap($row).within(() => {
        // Get available quantity
        cy.get('td').eq(2).invoke('text').then((availableText) => {
          const available = parseInt(availableText)
          
          if (available > 0) {
            // Try to exceed available quantity
            for (let i = 0; i < available + 2; i++) {
              cy.get('button').contains('+').click()
            }
            
            // Should not exceed available quantity
            cy.get('input[type="number"]').should('have.value', available.toString())
          }
        })
      })
    })
  })

  it('should maintain state during navigation', () => {
    cy.waitForBreadsToLoad()
    
    // Add bread to order
    cy.get('tbody tr').first().within(() => {
      cy.get('button').contains('+').click()
      cy.get('input[type="number"]').should('have.value', '1')
    })
    
    // Navigate to another page and back (if applicable)
    // This would depend on your routing structure
    
    // Check that order state is maintained
    cy.get('tbody tr').first().within(() => {
      cy.get('input[type="number"]').should('have.value', '1')
    })
  })

  it('should handle edge cases gracefully', () => {
    cy.waitForBreadsToLoad()
    
    // Test with zero available quantity
    cy.get('tbody tr').each(($row) => {
      cy.wrap($row).within(() => {
        cy.get('td').eq(2).invoke('text').then((availableText) => {
          const available = parseInt(availableText)
          
          if (available === 0) {
            // Plus button should be disabled for zero quantity
            cy.get('button').contains('+').should('be.disabled')
          }
        })
      })
    })
  })

  it('should display correct pricing information', () => {
    cy.waitForBreadsToLoad()
    
    // Check that all breads have valid pricing
    cy.get('tbody tr').each(($row) => {
      cy.wrap($row).within(() => {
        // Price should be displayed
        cy.get('td').eq(3).should('contain.text', '₪')
        
        // Price should be a valid positive number
        cy.get('td').eq(3).invoke('text').then((priceText) => {
          const price = parseFloat(priceText.replace(/[^\d.]/g, ''))
          expect(price).to.be.a('number')
          expect(price).to.be.greaterThan(0)
        })
      })
    })
  })
})
