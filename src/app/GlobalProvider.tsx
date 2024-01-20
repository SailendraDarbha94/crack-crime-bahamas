//@ts-nocheck
import { createContext, useContext, useReducer } from "react";


  function reducer(state: any, action: any) {
    if (action.type === "log") {
      return console.log(state)
    }

    // if (action.type === 'undo') {
    //     const { guesses, cards } = state;
    //     const oldGuesses = [...guesses];
    //     const oldCards = [...cards];
    //     oldGuesses.shift();
    //     oldCards.shift();

    //     return {
    //         guesses: oldGuesses,
    //         cards: oldCards,
    //     };
    // }

    // if (action.type === 'reset') {
    //     return { guesses: [], cards: [] };
    // }
  }

  export const GlobalContext = createContext({
    initLog: "Hello, World",
  });

  export const GlobalDispatchContext = createContext({});

  export function useGlobal() {
    return useContext(GlobalContext);
  }

  export function useGlobalDispatch() {
    return useContext(GlobalDispatchContext);
  }

  function GlobalProvider({ children }:any) {
  const [state, dispatch] = useReducer(reducer, "Hello");
  return (
    <GlobalContext.Provider value={state}>
      <GlobalDispatchContext.Provider value={dispatch}>
        {children}
      </GlobalDispatchContext.Provider>
    </GlobalContext.Provider>
  );
  }


export default GlobalProvider;
