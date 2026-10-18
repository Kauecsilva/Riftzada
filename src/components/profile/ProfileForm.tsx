"use client";

import { useActionState, useState } from "react";
import { Field, fieldProps } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { ImageInput } from "@/components/ui/ImageInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { UFS } from "@/lib/domain/region";
import { initialActionState } from "@/lib/validation/common";
import { updateProfile } from "@/server/actions/content";
import type { Legend, Profile } from "@/types/domain";

export function ProfileForm({ profile, legends, contact }: {
  profile: Profile; legends: Legend[]; contact: { whatsapp: string | null; shareWhatsapp: boolean };
}) {
  const [state, action] = useActionState(updateProfile, initialActionState);
  const [whatsapp, setWhatsapp] = useState(contact.whatsapp ?? "");
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <Field label="Foto" name="avatarPath">
        <ImageInput name="avatarPath" folder="avatars" userId={profile.id} initialUrl={profile.avatarUrl} round label="Escolher foto" />
      </Field>
      <Field label="Nome" name="displayName" error={err.displayName}>
        <input {...fieldProps("displayName", err.displayName)} defaultValue={profile.displayName} required maxLength={40} className="input" />
      </Field>
      <Field label="Bio" name="bio" error={err.bio} optional hint="Até 160 caracteres.">
        <textarea {...fieldProps("bio", err.bio, "hint")} defaultValue={profile.bio ?? ""} maxLength={160} rows={3} className="input" placeholder="Jinx até o fim." />
      </Field>
      <Field label="Lenda favorita" name="favoriteLegendId" optional>
        <select {...fieldProps("favoriteLegendId")} defaultValue={profile.favoriteLegend?.id ?? ""} className="input">
          <option value="">Nenhuma</option>
          {legends.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </Field>
      <Field label="Instagram" name="instagram" error={err.instagram} optional>
        <input {...fieldProps("instagram", err.instagram)} defaultValue={profile.instagram ?? ""} className="input" placeholder="@seu.user" autoCapitalize="none" />
      </Field>
      <div className="grid grid-cols-[1fr_6.5rem] gap-3">
        <Field label="Cidade" name="city" error={err.city} optional hint="Aparece no perfil e nos seus anúncios do Mercado.">
          <input {...fieldProps("city", err.city, "hint")} defaultValue={profile.city ?? ""} maxLength={60} className="input" placeholder="Campinas" autoComplete="address-level2" />
        </Field>
        <Field label="Estado" name="state" error={err.state}>
          <select {...fieldProps("state", err.state)} defaultValue={profile.state ?? ""} className="input" autoComplete="address-level1">
            <option value="">UF</option>
            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </Field>
      </div>

      <fieldset className="card space-y-4 p-4">
        <legend className="sr-only">Contato</legend>
        <Field label="WhatsApp" name="whatsapp" error={err.whatsapp} optional hint="Só aparece se você liberar abaixo. Usado nos botões de WhatsApp do Mercado, já com a carta e a oferta na mensagem.">
          <input {...fieldProps("whatsapp", err.whatsapp, "hint")} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} type="tel" inputMode="tel" className="input" placeholder="(11) 98765-4321" />
        </Field>
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input type="checkbox" name="shareWhatsapp" defaultChecked={contact.shareWhatsapp} disabled={!whatsapp} className="size-5 accent-rift" />
          <span className="text-sm font-medium">Mostrar meu WhatsApp para a comunidade</span>
        </label>
      </fieldset>

      <FormMessage state={state} />
      <SubmitButton>Salvar perfil</SubmitButton>
    </form>
  );
}
