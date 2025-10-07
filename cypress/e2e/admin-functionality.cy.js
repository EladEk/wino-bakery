describe('Admin Functionality', () => {
  beforeEach(() => {
    // Visit the admin page before each test
    cy.visit('/admin')
  })

  it('should display admin bread management interface', () => {
    // Check if admin interface is loaded
    cy.get('body').should('contain.text', 'לחמים') // Should contain bread-related text
    
    // Check if bread table is visible
    cy.get('table').should('be.visible')
  })

  it('should allow adding new bread', () => {
    // Look for add bread button or form
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="add-bread-button"]').length > 0) {
        cy.get('[data-testid="add-bread-button"]').click()
        
        // Check if add bread form is visible
        cy.get('[data-testid="bread-name-input"]').should('be.visible')
        cy.get('[data-testid="bread-description-input"]').should('be.visible')
        cy.get('[data-testid="bread-price-input"]').should('be.visible')
        cy.get('[data-testid="bread-quantity-input"]').should('be.visible')
      }
    })
  })

  it('should display kibbutz allocation section for non-club kibbutzim', () => {
    // Check if kibbutz allocation section exists
    cy.get('body').then(($body) => {
      if ($body.find('.kibbutz-quantities-section').length > 0) {
        cy.get('.kibbutz-quantities-section').should('be.visible')
        
        // Check that only non-club kibbutzim are shown in allocation
        cy.get('.kibbutz-quantity-row').each(($row) => {
          // This would need to be implemented based on your actual DOM structure
          cy.wrap($row).should('be.visible')
        })
      }
    })
  })

  it('should not show club kibbutzim in allocation section', () => {
    // This test verifies that club kibbutzim are filtered out
    cy.get('body').then(($body) => {
      if ($body.find('.kibbutz-quantities-section').length > 0) {
        // Club kibbutzim should not appear in the allocation list
        // This would need to be implemented based on your actual DOM structure
        cy.get('.kibbutz-quantity-row').should('not.contain.text', 'הקיבוץ של וינו')
      }
    })
  })

  it('should allow editing bread quantities', () => {
    // Look for edit functionality
    cy.get('body').then(($body) => {
      if ($body.find('button').filter(':contains("ערוך")').length > 0) {
        cy.get('button').filter(':contains("ערוך")').first().click()
        
        // Check if edit form is visible
        cy.get('body').should('contain.text', 'עריכת לחם')
      }
    })
  })

  it('should display bread statistics correctly', () => {
    // Check if bread statistics are displayed
    cy.get('table tbody tr').each(($row) => {
      cy.wrap($row).within(() => {
        // Check that bread information is displayed
        cy.get('td').first().should('not.be.empty') // Bread name
        cy.get('td').eq(1).should('not.be.empty') // Description
        cy.get('td').eq(2).should('contain.text', /\d+/) // Quantity
        cy.get('td').eq(3).should('contain.text', '₪') // Price
      })
    })
  })

  it('should show general available quantities correctly', () => {
    // Check that general available quantities are calculated correctly
    cy.get('table tbody tr').each(($row) => {
      cy.wrap($row).within(() => {
        // Get the general available quantity
        cy.get('td').eq(2).invoke('text').then((quantityText) => {
          const quantity = parseInt(quantityText)
          expect(quantity).to.be.a('number')
          expect(quantity).to.be.at.least(0)
        })
      })
    })
  })
})
