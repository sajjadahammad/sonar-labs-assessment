import { useDispatch } from "react-redux"
import type { AppDispatch } from "@/store/store"

/** Typed version of `useDispatch` scoped to the app’s store. */
export const useAppDispatch: () => AppDispatch = useDispatch
