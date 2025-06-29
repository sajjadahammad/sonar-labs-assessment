import { useSelector, type TypedUseSelectorHook } from "react-redux"
import type { AppDispatch } from "@/store/store"

/** Typed version of `useSelector` scoped to the app’s store. */
export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector
