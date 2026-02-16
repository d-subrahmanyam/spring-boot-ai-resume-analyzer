import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import candidatesReducer from './slices/candidatesSlice'
import jobsReducer from './slices/jobsSlice'
import matchesReducer from './slices/matchesSlice'
import uploadReducer from './slices/uploadSlice'
import rootSaga from './sagas'

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
  reducer: {
    candidates: candidatesReducer,
    jobs: jobsReducer,
    matches: matchesReducer,
    upload: uploadReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
})

sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
