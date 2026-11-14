import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MOOD_LABELS, MOODS, NO_MOOD, type Mood } from "@/lib/moods"
import { cn } from "@/lib/utils"

import { useAddReply } from "@/features/quack/hooks/useAddReply"

// Mirrors the server-side DTO (MaxLength(280)).
const MAX_LENGTH = 280

const schema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Write something first")
    .max(MAX_LENGTH, `Keep it under ${MAX_LENGTH} characters`),
  mood: z.enum([NO_MOOD, ...MOODS]),
})

type FormValues = z.infer<typeof schema>

type ReplyFormProps = {
  quackId: string
  className?: string
  defaultMood?: Mood | null
}

export function ReplyForm({ quackId, className, defaultMood }: ReplyFormProps) {
  const addReply = useAddReply()
  const emptyValues: FormValues = { text: "", mood: defaultMood ?? NO_MOOD }
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })
  const length = useWatch({ control: form.control, name: "text" })?.length ?? 0

  const handleSubmit = (values: FormValues) => {
    addReply.mutate(
      {
        quackId,
        text: values.text,
        mood: values.mood === NO_MOOD ? undefined : values.mood,
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
        {addReply.error ? (
          <Alert variant="destructive">
            <AlertDescription>{addReply.error.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Your reply</FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="Quack back..."
                    disabled={addReply.isPending}
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
                  disabled={addReply.isPending}
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
            disabled={addReply.isPending}
          >
            {addReply.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Reply
          </Button>
        </div>
      </form>
    </Form>
  )
}
