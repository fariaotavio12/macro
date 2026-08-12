# Contexto: Capturas unificadas

**Gathered:** 2026-08-12
**Spec:** `.specs/features/capturas-unificadas/spec.md`
**Status:** Approved

---

## Feature Boundary

Substituir a lista e o editor de perfis por uma única configuração global editável diretamente na página de Capturas. A mudança inclui autosave, migração dos perfis existentes e preservação das ações de ativar, executar, parar e testar detecção.

---

## Implementation Decisions

### Modelo de configuração

- Existe uma única configuração global de Capturas.
- Todos os Pokémon usam o mesmo atalho, tecla de pokébola, área e opções de execução.
- A experiência não apresenta nome, criação, seleção, duplicação ou exclusão de perfil.
- O domínio interno também passa a representar uma configuração global real; não será apenas uma simplificação visual sobre perfis ocultos.

### Persistência

- As alterações são salvas automaticamente.
- A tela informa salvamento em andamento, sucesso e falha.
- Uma falha não descarta os valores editados.

### Migração

- Todos os Pokémon de todos os perfis legados são reunidos.
- As demais opções vêm do primeiro perfil ativo em ordem alfabética; sem perfil ativo, vêm do primeiro perfil.
- IDs repetidos de templates são regenerados sem deduplicar Pokémon por nome ou imagem.

### Agent's Discretion

- Composição visual exata dos cards e espaçamentos, respeitando os componentes existentes.
- Mecanismo interno de serialização do autosave, desde que a gravação mais recente prevaleça.
- Texto curto dos indicadores de estado, mantendo “Salvando”, “Salvo” e “Erro ao salvar”.

### Declined / Undiscussed Gray Areas → Assumptions

- Seções essenciais visíveis e configurações avançadas recolhíveis.
- Arquivos legados mantidos como backup após a migração.
- Teste de detecção aguarda o autosave mais recente concluir com sucesso.

---

## Specific References

- O usuário quer “adicionar Pokémon” e configurar as teclas na mesma tela de Capturas.
- A motivação é não precisar configurar ou entrar em um perfil toda vez.

---

## Deferred Ideas

- Configurações e teclas específicas por Pokémon.
- Mais de um conjunto de Capturas.
