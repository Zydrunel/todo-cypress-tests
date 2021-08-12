//   MANUAL CHECKS:
//   1. Validate 'todos' page is implemented according to the designs (this highly depends on how team works with design, if styled components are built in advance and then used consumed ony while building component/page):
//     a) Correct components are consumed with expected properties
//     b) CSS styles are implemented as per designs
//     c) hover / focus / active state are implemented as per designs
//   2. Validate application responsiveness on different resolutions (depends on requirements)
//   3. Validate application loads successfully on different browsers (say latest stable Chrome, Firefox, Safari, etc. depending on user stats)
//   4. Given user visits the application for the 1st time then todos item list is not present and input component is displayed with 'What needs to be done?' placeholder.
//   5. Given user focuses 'What needs to be done?' input then blnking cursor is visible.
//   6. Given user starts typing then text is appearing on the input in expected style.
//   7. Given maximum X characters are applied for the input and user types X characters then X+1 are not allowed.
//   8. Given user types a todo and triggers Enter key then a new active list item is added and input is cleared.
//   9. Given user adds a new todo item, "react-todos" array is added to localStorage with item object.
//   10.Each new item object added to localSorage contains id (random generated uuid), title (user input string), completed (true/false).
//   11.Newly added item has completed:false applied.
//   12.Given user adds a new todo item then it gets added to the bottom of the list.
//   13.Given user hovers over any list item, X (remove) button is displayed.
//   14.Each list item component has checkbox displayed.
//   15.Given user checks specific item then item is considered completed with expecting styles applied (cmpleted:true)
//   16.Given user clicks on X CTA then item is removed from the list (and from localStorage)
//   17.Given user double click on todo item then user can edit the item.
//   18.Given at least one todo item is added then footer with items count and filters is displayed below the list.
//   19.Given user has 5 active and 10 completed todo items then total count displays "5 items left"
//   20.Given user has 1 active todo item then total count displays "1 item left"
//   21.Given user has 10 completed and no active todo items then total count displays "0 items left"
//   22.Given user has 2 completed items and 1 active and user selects "All" filter then 3 list items are displayed.
//   23.Given user has 2 completed items and 1 active and user selects "Active" filter then 1 item is displayed.
//   24.Given user has 2 completed items and 1 active and user selects "Completed" filter then 2 items are displayed.
//   25.Given user has only 3 completed items and user selects "Active" filter then 0 items are displayed.
//   26.Given user has at least 1 completed item then "Clear completed" CTA appears in the body footer.
//   27.Given user clicks on "Clear completed" CTA items with completed:true are removed for the list.
//   28.Given user refreshes the application then the list is populated with items from localStorage.
//   29.Given user clears local storage and adds a new item then `react-todos` array is re-created.
//   30.Given user blocks browser cookies then user is still able to add new todos and interacting with the application (items won't persist after reload though).
//   31.Given todo items list does not fit the screen then page scroll is present.

const localStorageItems = require('../fixtures/localStorageitems')

const selectors = {
//The way data testids are defined in this project is not particularly distinctive and clear.
//However selecting by unique data-id is the better practice than class which can be reused.
  todosList: '[data-reactid=".0.1.1"]',
  todosItems: '[data-reactid=".0.1.1"] > li',
  activeFilter: '[data-reactid=".0.2.1.2.0"]',
  completedFilter: '[data-reactid=".0.2.1.4.0"]',
  newTodoInput: '[data-reactid=".0.0.1"]',
}

describe('TodoMVC', function () {
  beforeEach(function () {
    cy.visit('/')
  })

  afterEach(() => {
    // In firefox, blur handlers will fire upon navigation if there is an activeElement.
    // Since todos are updated on blur after editing,
    // this is needed to blur activeElement after each test to prevent state leakage between tests.
    cy.window().then((win) => {
      // @ts-ignore
      win.document.activeElement.blur()
    })
  })

  it('Successfully creates, updates, completes and clears a todo', function () {
    const todoTitle = 'Plan holidays for September'
    const todoEditTitle = ' 20th - 25th'

    cy.focused()
    .should('have.attr', 'placeholder', 'What needs to be done?')
    .type(`${todoTitle}{enter}`)

    cy.get(selectors.todosList)
    .children()
    .should('have.length', 1)
    .contains(todoTitle)
    .dblclick()

    cy.focused()
    .should('have.value', todoTitle)
    .type(`${todoEditTitle}{enter}`)

    cy.get(selectors.todosList)
    .children()
    .should('have.length', 1)
    .contains(`${todoTitle}${todoEditTitle}`)

    cy.contains(`${todoTitle}${todoEditTitle}`)
    .siblings('input[type="checkbox"]')
    .should('not.be.checked')
    .check()
    .should('be.checked')

    cy.get(selectors.todosList)
    .contains('li', `${todoTitle}${todoEditTitle}`)
    .should('have.class', 'completed').within(() => {
      cy.get('button.destroy')
      .should('have.css', 'display', 'none')
      .invoke('show').click()
    })

    cy.get(selectors.todosList).should('not.exist')

  })

  it('Correctly displays previously saved times after refresh', function () {
    cy.addItemsToLocalstorage(localStorageItems)

    cy.reload(true)

    cy.getLocalStorage('react-todos').then((todos) => {
      const todosListInLocalStorage = JSON.parse(todos)

      cy.get(selectors.todosList)
      .children()
      .should('have.length', todosListInLocalStorage.length)

      // Traversing through li elements to make sure they have the same index as in local storage
      cy.get(selectors.todosItems).each(($todo, i) => {
        expect($todo).to.have.text(todosListInLocalStorage[i].title)

        if (todosListInLocalStorage[i].completed) {
          expect($todo).to.have.class('completed')
        } else {
          expect($todo).not.to.have.class('completed')
        }
      })
    })
  })

  it('Filters Active and Completed todos successfully', function () {
    cy.addItemsToLocalstorage(localStorageItems)

    cy.get(selectors.todosList)
    .children()
    .should('have.length', localStorageItems.value.length)

    cy.get(selectors.activeFilter)
    .should('not.have.class', 'selected')
    .and('have.attr', 'href', '#/active')
    .click()
    .should('have.class', 'selected')

    const activeItems = localStorageItems.value.filter((item) => item.completed === false)

    cy.get(selectors.todosList)
    .children()
    .should('have.length', activeItems.length)

    cy.get(selectors.todosItems).each(($todo, i) => {
      expect($todo).to.have.text(activeItems[i].title)
      expect($todo).not.to.have.class('completed')
    })

    cy.get(selectors.completedFilter)
    .should('not.have.class', 'selected')
    .and('have.attr', 'href', '#/completed')
    .click()
    .should('have.class', 'selected')

    const completedItems = localStorageItems.value.filter((item) => item.completed === true)

    cy.get(selectors.todosList)
    .children()
    .should('have.length', completedItems.length)

    cy.get(selectors.todosItems).each(($todo, i) => {
      expect($todo).to.have.text(completedItems[i].title)
      expect($todo).to.have.class('completed')
    })
  })
})

