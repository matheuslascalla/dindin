import { redirect } from 'next/navigation';

import { getActiveContext } from '@/lib/context';
import { getHouseDetails } from '@/server/actions/house';
import { GerenciarCasaClient } from './GerenciarCasaClient';

export default async function GerenciarCasaPage() {
  const activeCtx = await getActiveContext();

  if (!activeCtx || activeCtx.type !== 'house') {
    redirect('/contexto');
  }

  const { houseId, houseName } = activeCtx;
  const house = await getHouseDetails(houseId);

  if (!house) redirect('/contexto');

  return (
    <GerenciarCasaClient
      houseId={houseId}
      houseName={houseName}
      inviteCode={house.isOwner ? house.inviteCode : null}
      isOwner={house.isOwner}
      members={house.members}
      pendingInvites={house.invites}
    />
  );
}
