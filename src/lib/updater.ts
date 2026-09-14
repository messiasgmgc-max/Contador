/**
 * Utilitário de verificação de atualizações no GitHub
 */

export interface UpdateInfo {
  hasUpdate: boolean;
  latestCommit: string;
  latestCommitShort: string;
  commitMessage: string;
  commitDate: string;
  apkDownloadUrl?: string;
}

export const CURRENT_COMMIT = typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : 'dev';
export const CURRENT_BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '';

/**
 * Consulta a API do GitHub para checar o commit mais recente na branch main
 */
export async function checkForAppUpdates(): Promise<UpdateInfo | null> {
  try {
    const res = await fetch('https://api.github.com/repos/messiasgmgc-max/Contador/commits/main', {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = await res.json();
    const latestCommit = data.sha as string;
    const latestCommitShort = latestCommit.slice(0, 7);
    const commitMessage = (data.commit?.message || '').split('\n')[0];
    const commitDate = data.commit?.author?.date || '';

    const isNewer = CURRENT_COMMIT !== 'dev' && latestCommit !== CURRENT_COMMIT;

    return {
      hasUpdate: isNewer,
      latestCommit,
      latestCommitShort,
      commitMessage,
      commitDate,
      apkDownloadUrl: 'https://github.com/messiasgmgc-max/Contador/releases/download/latest/FluxoFinanceiro.apk',
    };
  } catch {
    return null;
  }
}