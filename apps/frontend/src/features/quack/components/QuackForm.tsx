import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, X } from "lucide-react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { MOOD_LABELS, MOODS, NO_MOOD, type Mood } from "@/lib/moods"
import { cn } from "@/lib/utils"

import { useAddQuack } from "@/features/quack/hooks/useAddQuack"

// Mirrors the server-side DTO (MaxLength(280)) so the user is told before
// the request is made — the server still validates independently.
const MAX_LENGTH = 280

// Mirror the server-side limits (2–6 options, 80 characters each, no
// duplicates) so the user is told before the request is made.
const MIN_OPTIONS = 2
const MAX_OPTIONS = 6
const MAX_OPTION_LENGTH = 80
const EMPTY_OPTIONS = [{ text: "" }, { text: "" }]

const schema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, "Write something first")
      .max(MAX_LENGTH, `Keep it under ${MAX_LENGTH} characters`),
    mood: z.enum([NO_MOOD, ...MOODS]),
    isPoll: z.boolean(),
    options: z.array(
      z.object({
        text: z.string().trim(),
      }),
    ),
  })
  .superRefine((values, ctx) => {
    if (!values.isPoll) return
    const seen = new Set<string>()
    values.options.forEach((option, index) => {
      // Same normalisation as the server: case and accents are ignored.
      const key = option.text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
      if (!option.text) {
        ctx.addIssue({
          code: "custom",
          path: ["options", index, "text"],
          message: "Write an answer",
        })
      } else if (option.text.length > MAX_OPTION_LENGTH) {
        ctx.addIssue({
          code: "custom",
          path: ["options", index, "text"],
          message: `Keep it under ${MAX_OPTION_LENGTH} characters`,
        })
      } else if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["options", index, "text"],
          message: "Answers must be different",
        })
      }
      seen.add(key)
    })
  })

type FormValues = z.infer<typeof schema>

type QuackFormProps = {
  className?: string
  // The mood a new quack starts with (chosen in Settings).
  defaultMood?: Mood | null
}

export function QuackForm({ className, defaultMood }: QuackFormProps) {
  const addQuack = useAddQuack()
  const emptyValues: FormValues = {
    text: "",
    mood: defaultMood ?? NO_MOOD,
    isPoll: false,
    options: EMPTY_OPTIONS,
  }
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "options" })
  const isPoll = useWatch({ control: form.control, name: "isPoll" })

  const text = useWatch({ control: form.control, name: "text" })
  const length = text?.length ?? 0

  const handleSubmit = (values: FormValues) => {
    addQuack.mutate(
      {
        text: values.text,
        mood: values.mood === NO_MOOD ? undefined : values.mood,
        poll: values.isPoll ? { options: values.options.map((option) => option.text) } : undefined,
      },
      { onSuccess: () => form.reset(emptyValues) },
    )
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-3", className)}
      >
        {addQuack.error ? (
          <Alert variant="destructive">
            <AlertDescription>{addQuack.error.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>New quack</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Quack something..."
                    disabled={addQuack.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mood"
            render={({ field }) => (
              <FormItem className="sm:w-36">
                <FormLabel>Mood</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={addQuack.isPending}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isPoll"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={addQuack.isPending}
                />
              </FormControl>
              <FormLabel>Add a poll</FormLabel>
            </FormItem>
          )}
        />

        {isPoll ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Poll answers</legend>
            {fields.map((item, index) => (
              <FormField
                key={item.id}
                control={form.control}
                name={`options.${index}.text`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Answer {index + 1}</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Pizza"
                          disabled={addQuack.isPending}
                          {...field}
                        />
                      </FormControl>
                      {fields.length > MIN_OPTIONS ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove answer ${index + 1}`}
                          disabled={addQuack.isPending}
                          onClick={() => remove(index)}
                        >
                          <X className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            {fields.length < MAX_OPTIONS ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                disabled={addQuack.isPending}
                onClick={() => append({ text: "" })}
              >
                <Plus className="size-4" />
                Add answer
              </Button>
            ) : null}
          </fieldset>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <span
            className={cn(
              "text-sm",
              length > MAX_LENGTH ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {length}/{MAX_LENGTH}
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={addQuack.isPending}
          >
            {addQuack.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Quack
          </Button>
        </div>
      </form>
    </Form>
  )
}
