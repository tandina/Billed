/**
 * @jest-environment jsdom
 */

import {screen, waitFor,getByTestId } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import MockedStore from "../__mocks__/store"
import Bills from "../containers/Bills";
import { ROUTES } from "../constants/routes"

import router from "../app/Router.js";
jest.mock("../app/store",() => MockedStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      
      //to-do write expect expression
      expect(screen.getByTestId('icon-window')).toHaveClass('active-icon')
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => (b - a)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    describe('When I click on "Nouvelle note de frais', () => { 
      test("It's display a new bill form", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname})
        }
        const bills = new Bills({
          document, onNavigate, MockedStore, localStorage
        })
        const handleClickNewBill = jest.fn((e) => bills.handleClickNewBill(e))
        const addNewBill = screen.getByTestId('btn-new-bill')
        addNewBill.addEventListener("click", handleClickNewBill)
        userEvent.click(addNewBill)
        expect(handleClickNewBill).toHaveBeenCalled();
        expect(screen.queryByText('Envoyer une note de frais')).toBeTruthy()
      })
     })
     describe('When I click on eye icon', () => { 
      test("It's show a modal", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname})
        }
        document.body.innerHTML = BillsUI({ data: bills })
        const bills2 = new Bills({
          document, onNavigate, localStorage: window.localStorage
        });
        const handleClickIconEye = jest.fn((icon) => bills2.handleClickIconEye(icon))
        const modaleFile = document.getElementById("modaleFile")
        const iconEye = screen.getAllByTestId("icon-eye");
        $.fn.modal = jest.fn(() => modaleFile.classList.add("show"))
        iconEye.forEach(icon => {
          icon.addEventListener("click", handleClickIconEye(icon))
          userEvent.click(icon)
          expect(handleClickIconEye).toHaveBeenCalled()
        });
        expect(modaleFile).toHaveClass('show')
      })
    })
  })
})

 // Test d'intégration GET
describe('Given I am connected as Admin', () => { 
  describe('When I navigate to Bills', () => { 
    test('Then fetche bills from mock API GET', async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Admin", email: "a@a" }));
      new Bills({
        document, onNavigate, MockedStore, localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: bills })
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getByText("Mes notes de frais")).toBeTruthy()
    })
   })

   describe('When an error happend on API', () => { 
    beforeEach(() => {
      jest.spyOn(MockedStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
    })
    test('should show an error 404', async () => { 
      MockedStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
        const html = BillsUI({ error: "Erreur 404" })
        document.body.innerHTML = html
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
     })

     test('should show an error 500 and a message', async () => { 
      MockedStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})
        const html = BillsUI({ error: "Erreur 500" })
        document.body.innerHTML = html
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
