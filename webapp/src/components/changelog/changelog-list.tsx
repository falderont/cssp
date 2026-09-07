import { Sparkles } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { createChangelogEntry, deleteChangelogEntry } from "@/actions/changelog";
import { CHANGELOG_CATEGORIES, CHANGELOG_CATEGORY_TONES, type ChangelogCategory } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { ActionForm } from "@/components/errors/action-form";

type ChangelogItem = {
  id: string;
  title: string;
  version: string | null;
  category: string;
  description: string;
  publishedAt: Date;
};

export function ChangelogList({ entries, canManage }: { entries: ChangelogItem[]; canManage: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {entries.length === 0 && (
          <Card>
            <CardBody className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
              <Sparkles className="h-8 w-8" />
              <p className="text-sm">Nothing published yet.</p>
            </CardBody>
          </Card>
        )}
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardBody>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-slate-900">{entry.title}</h3>
                    <Badge tone={CHANGELOG_CATEGORY_TONES[entry.category as ChangelogCategory] ?? "slate"}>{entry.category}</Badge>
                    {entry.version && <Badge tone="slate">{entry.version}</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(entry.publishedAt)}</p>
                </div>
                {canManage && (
                  <ConfirmDeleteButton
                    action={deleteChangelogEntry.bind(null, entry.id)}
                    confirmMessage={`Remove the changelog entry "${entry.title}"? This can't be undone.`}
                    label="Delete"
                    iconOnly
                  />
                )}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{entry.description}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {canManage && (
        <Card>
          <CardBody>
            <p className="mb-3 text-sm font-medium text-slate-700">Publish an entry</p>
            <ActionForm action={createChangelogEntry} className="space-y-3">
              <Field label="Title" htmlFor="clTitle" required>
                <Input id="clTitle" name="title" required placeholder="e.g. Site-scoped Loading Docks" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category" htmlFor="clCategory" required>
                  <Select id="clCategory" name="category" defaultValue="Improvement" required>
                    {CHANGELOG_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Version (optional)" htmlFor="clVersion">
                  <Input id="clVersion" name="version" placeholder="e.g. v2.1" />
                </Field>
              </div>
              <Field label="Description" htmlFor="clDescription" required>
                <Textarea id="clDescription" name="description" required placeholder="What changed and why it matters." />
              </Field>
              <Button type="submit" className="w-full">
                Publish
              </Button>
            </ActionForm>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
