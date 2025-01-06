import { combineReducers, configureStore } from "@reduxjs/toolkit"
import careNotesReducer from "../features/careNotes/careNotesSlice"
import sessionReducer from "../features/session/sessionSlice"

export const rootReducer = combineReducers({
  careNotes: careNotesReducer,
  session: sessionReducer,
})

export type PreloadedAppState = Partial<ReturnType<typeof rootReducer>>

/**
 * One store per render tree rather than a module-level singleton, so the
 * server-rendered session can be handed in as preloaded state and so tests
 * never share state between cases.
 */
export const makeStore = (preloadedState?: PreloadedAppState) =>
  configureStore({ reducer: rootReducer, preloadedState })

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
