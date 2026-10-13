import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { HTTPError } from "@/lib/api-client"
import { MOOD_LABELS, MOODS, NO_MOOD } from "@/lib/moods"
import { cn } from "@/lib/utils"

import type { ProfileInput } from "@/features/profile/api/updateProfile"

// These mirror the server-side DTO — the server still validates independently.
const USERNAME_MIN = 3
const USERNAME_MAX = 30
const NAME_MAX = 50
const BIO_MAX = 160

const USERNAME_TAKEN = "That username is already taken. Try a different one."

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Enter a username")
    .min(USERNAME_MIN, `Username must be at least ${USERNAME_MIN} characters`)
    .max(USERNAME_MAX, `Username must be at most ${USERNAME_MAX} characters`)
    .regex(/^[A-Za-z0-9._]+$/, "Use only letters, numbers, dots and underscores"),
  name: z
    .string()
    .trim()
    .min(1, "Enter a display name")
    .max(NAME_MAX, `Display name must be at most ${NAME_MAX} characters`),
  bio: z.string().trim().max(BIO_MAX, `Bio must be at most ${BIO_MAX} characters`),
  defaultMood: z.enum([NO_MOOD, ...MOODS]),
})

type FormValues = z.infer<typeof schema>

// What is saved on the server, as the form sees it.
export type SavedSettings = ProfileInput

const toFormValues = (saved: SavedSettings): FormValues => ({
  username: saved.username,
  name: saved.name,
  bio: saved.bio,
  defaultMood: saved.defaultMood ?? NO_MOOD,
})

type SettingsFormProps = {
  saved: SavedSettings
  // Resolves once the change is saved; rejects with the server's error.
  onSave: (values: SavedSettings) => Promise<void>
}

export function SettingsForm({ saved, onSave }: SettingsFormProps) {
  const [error, setError] = useState<string | null>(null)
  const values = toFormValues(saved)

  // `values` keeps the form in step with what is saved: after a save it takes
  // the new values, and "Discard" returns to them.
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values,
  })
  const { isSubmitting } = form.formState

  const bio = useWatch({ control: form.control, name: "bio" })
  const bioLength = bio?.length ?? 0

  const handleSubmit = async (formValues: FormValues) => {
    setError(null)
    try {
      await onSave({
        username: formValues.username,
        name: formValues.name,
        bio: formValues.bio,
        defaultMood: formValues.defaultMood === NO_MOOD ? null : formValues.defaultMood,
      })
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not save your settings"
      if (caught instanceof HTTPError && caught.response.status === 409) {
        // Taken username: say so at the field and keep what was typed.
        form.setError("username", { message: USERNAME_TAKEN }, { shouldFocus: true })
      } else {
        setError(message)
      }
    }
  }

  const handleDiscard = () => {
    setError(null)
    form.reset(values)
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-8"
      >
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Profile</h2>

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="username"
                    spellCheck={false}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {USERNAME_MIN}–{USERNAME_MAX} characters: letters, numbers, dots and underscores.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <div className="flex justify-between gap-3">
                  <FormMessage />
                  <span
                    className={cn(
                      "ml-auto text-sm",
                      bioLength > BIO_MAX ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {bioLength}/{BIO_MAX}
                  </span>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">New quacks</h2>

          <FormField
            control={form.control}
            name="defaultMood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default mood</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NO_MOOD}>No mood</SelectItem>
                    {MOODS.map((mood) => (
                      <SelectItem
                        key={mood}
                        value={mood}
                      >
                        {MOOD_LABELS[mood]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>The mood a new quack starts with.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Save changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscard}
            disabled={isSubmitting}
          >
            Discard changes
          </Button>
        </div>
      </form>
    </Form>
  )
}
