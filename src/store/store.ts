import { createStore } from "redux";


const initialData = {
  currentUserID: null,
  currentUser: null,
  userWallet:null

};

interface Action {
  type: string;
  payload?: any;
}


function Reducer(state = initialData, action: Action) {

  // console.log(action.payload, "actionPayload")
  switch (action.type) {
    case "currentUser":
      return {
        ...state,
        currentUser: action.payload,
       
      };
case "userWallet":
      return {
        ...state,
        userWallet: action.payload,
       
      };
      case "currentUserID": 
      return { ...state,  currentUserID: action.payload?.userId || null, };

    case "CLEAR_USER":
      return {
        ...state,
        currentUser: null,
        currentUserID: null,
      };

    default:
      return state;
  }
}

const store = createStore(Reducer);

export default store;