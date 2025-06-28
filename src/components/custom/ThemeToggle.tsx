"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const themes = [
  { name: "Light", value: "light", icon: Sun },
  { name: "Dark", value: "dark", icon: Moon },
  { name: "System", value: "system", icon: Palette },
]

const colorThemes = [
  { name: "Blue", value: "blue", color: "bg-blue-500" },
  { name: "Green", value: "green", color: "bg-green-500" },
  { name: "Purple", value: "purple", color: "bg-purple-500" },
  { name: "Orange", value: "orange", color: "bg-orange-500" },
  { name: "Red", value: "red", color: "bg-red-500" },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [colorTheme, setColorTheme] = React.useState("blue")

  React.useEffect(() => {
    document.documentElement.setAttribute("data-color-theme", colorTheme)
  }, [colorTheme])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-9 px-0">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-semibold">Theme Mode</div>
        {themes.map((themeOption) => {
          const Icon = themeOption.icon
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className="flex items-center space-x-2"
            >
              <Icon className="h-4 w-4" />
              <span>{themeOption.name}</span>
              {theme === themeOption.value && <div className="ml-auto h-2 w-2 bg-blue-200 rounded-full" />}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-sm font-semibold">Color Theme</div>
        {colorThemes.map((color) => (
          <DropdownMenuItem
            key={color.value}
            onClick={() => setColorTheme(color.value)}
            className="flex items-center space-x-2"
          >
            <div className={`h-4 w-4 rounded-full ${color.color}`} />
            <span>{color.name}</span>
            {colorTheme === color.value && <div className="ml-auto h-2 w-2 bg-blue-200 rounded-full" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
