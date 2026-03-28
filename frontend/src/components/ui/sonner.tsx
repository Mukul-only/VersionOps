import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toaster]:text-muted-foreground",
          actionButton:
            "group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground",
          cancelButton:
            "group-[.toaster]:bg-muted group-[.toaster]:text-muted-foreground",
          success:
            "group-[.toaster]:bg-green-600 group-[.toaster]:text-white group-[.toaster]:border-green-700",
          error:
            "group-[.toaster]:bg-red-600 group-[.toaster]:text-white group-[.toaster]:border-red-700",
          warning:
            "group-[.toaster]:bg-yellow-500 group-[.toaster]:text-white group-[.toaster]:border-yellow-600",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
