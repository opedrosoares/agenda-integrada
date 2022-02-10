## Bem vindo ao Agenda Integrada ![Agenda Integrada](/dist/icons/icon-32.png)

**Agenda Integrada** sincroniza a Agenda de Autoridade do portal único [Gov.br](https://www.gov.br/pt-br) com os calendários do Google Agenda e Microsoft Outlook.

Criada a partir da necessidade de simplificação do registro e da divulgação das informações relativas a compromissos e agendas públicas federais, a ferramenta busca os compromissos inseridos nas agendas do Microsoft Outlook ou do Google Agenda para cadastrá-los automaticamente na única plataforma [Gov.br](https://www.gov.br/pt-br)

## Como começar?

Instale a extensão para o Google Chrome em:

> [https://chrome.google.com/webstore/detail/agendada-integrada/hdakgafffkflmfpejnbafpkgmlfjelcb](https://chrome.google.com/webstore/detail/agendada-integrada/hdakgafffkflmfpejnbafpkgmlfjelcb)

## Como utilizar?

Antes de iniciar o uso é necessário cadastrar nova **Base de Agenda**.

Clique no ícone da extensão e acesse suas configurações internas. Adicione uma nova base preenchendo os seguintes campos:

> **Nome da Autoridade:** Título da agenda, utilizado apena para fins de referência.

> **Tipo de Agenda:** Selecione Microsoft Outlook ou Google Agenda.

> **URL do Calendário no formato ICS:** Link disponibilizado pelo provedor de calendário. Consulte a Seção [Obtendo URL do Calendário do Microsoft Outlook ou do Google Agenda](README.md#obtendo-url-do-calendário-do-microsoft-outlook-ou-do-google-agenda) para maiores informações.

> **URL da Agenda no Gov.br:** Link da agenda da autoridade no portal único [Gov.br](https://www.gov.br/pt-br).

> **URL do serviço de integração:** Link da API de leitura do arquivo ICS. Por padrão é fornecido um serviço gratuíto em [https://seipro.app/ical/](https://seipro.app/ical/). Caso deseje utilizar um serviço exclusivo, consulte a Seção [Criando sua própria API de leitura](README.md#criando-sua-própria-api-de-leitura).

> ![Tela Base Agenda](/img/tela-base-agenda.gif) 

## Como sincronizar?

Após cadastrada as informações de integração da Agenda, acesse a lista e inicie a sincronização.

Caso a plataforma Plone não esteja logada, você será direcionado para o login do portal único [Gov.br](https://www.gov.br/pt-br).

Caso a sincronização não seja iniciata automaticamente, clique no link **"Sincronizar Agenda"** disponível na barra superior da página.

> ![Tela Sincronização](/img/tela-sincronizacao.gif) 

A extensão irá pesquisar e cadastrar eventos 7 (sete) dias anteriores e posteriores à data atual. 
O número de dias de pesquisa poderá ser alterado dentro das configurações internas da extensão (**Aba Geral >> Pesquisar (n) dias antes e depois da data atual**)

## Quais informações são sincronizadas

A **Agenda Integrada** encontra as seguintes informações disponíveis nos calendários do Microsoft Outlook ou Google Agenda:

| Gov.br  |  Outlook  ou  Google Agenda  |
| ------------------- | ------------------- | ------------------- |
|  Nome da autoridade |  - (Não sincronizado) |
|  Data e hora de início |  Data e hora do início do evento  |
|  Date e hora de término |  Data e hora do término do evento  |
|  Compromisso |  Título do evento |
|  Solicitante |  Frase encontrada dentro da descrição do evento, logo após a palavra "Solicitante:"  |
|  Outros participantes |  Frase encontrada dentro da descrição do evento, logo após a palavra "Participantes:" |
|  Pauta |  Frase encontrada dentro da descrição do evento, logo após a palavra "Pauta:" |
|  Local do compromisso |  Local do evento |
|  Comentário interno (opcional) |  - (Não sincronizado) |

Para manter o máximo de transparência e aderência ao [Decreto nº 10.889, de 9 de dezembro de 2021](http://www.planalto.gov.br/ccivil_03/_Ato2019-2022/2021/Decreto/D10889.htm), mantenha ao menos os seguintes dados:

> Art. 11.  O agente público de que trata o art. 2º deverá registrar e publicar, por meio do e-Agendas ou por meio de sistema próprio, observado o disposto no art. 7º, as informações sobre:
> I - sua participação em compromisso público, ocorrido presencialmente ou não, ainda que fora do local de trabalho, com ou sem agendamento prévio, em território nacional ou estrangeiro, com, no mínimo:
> a) assunto;
> b) local;
> c) data;
> d) horário;
> e) lista de participantes; e
> (...)

> ![Tela Outlook Exemplo](/img/tela-exemplo-outlook.png) 
> 
> ![Tela GovBr Exemplo](/img/tela-exemplo-outlook.png) 

### Eventos privados

Eventos internos ou privados que não desejam ser sincronizados no [Gov.br](https://www.gov.br/pt-br) podem ser bloqueados para visualização externa.

Para isso, edite o evento no Microsoft Outlook ou Google Agenda e altere seu status para **Privado**:

> ![Tela Privado Outlook](/img/tela-privado-outlook.png) 

> ![Tela Privado Google](/img/tela-privado-google.png) 

## Obtendo URL do Calendário do Microsoft Outlook ou do Google Agenda

### Microsoft Outlook

Acesse as configurações dos **Calendários Compartilhados** do Outlook em [https://outlook.office.com/calendar/options/calendar/SharedCalendars](https://outlook.office.com/calendar/options/calendar/SharedCalendars) ou pelo caminho Configurações >> Calendário >> Calendários compartilhados.

Na seção **Publicar um calendário**, selecione o calendário desejado. 

Selecione as permissões **Pode exibir todos os detalhes**; clique em **Publicar**.

Copie o link do calendário em formato ICS. 

> ![Tela Outlook](/img/tela-outlook.gif) 

Cole nas configurações internas da extensão, Aba Bases de Agendas >> Campo URL do Calendário no formato ICS. 

Clique em **Salvar**

### Google Agenda

Acesse as configurações de **Integrar agenda** do Google Agenda pelo caminho Configurações >> Configurações das minhas agendas >> Integrar agenda.

Na seção **Endereço secreto no formato iCal**, clique no ícone **Copiar para a área de transferência**. 

> ![Tela Google](/img/tela-google.gif) 

Cole nas configurações internas da extensão, Aba Bases de Agendas >> Campo URL do Calendário no formato ICS. 

Clique em **Salvar**

## Sincronizando mais de uma Agenda

É possível adicionar mais de uma **Base de Agenda** para sincronia, clicando no botão **Adicionar nova base**.

Acesse a Aba Geral e ative a opção **Sincronizar outras agendas automaticamente (caso existam)**. Ao final do processo de sincronia a próxima Agenda cadastrada será automaticamente sincronizada.

## Criando sua própria API de leitura

Para que seja possível interpretar as informações de compromissos agendados nos calendários no Microsoft Outlook ou Google Agenda a extensão **Agenda Integrada** utiliza um serviço de API simples, disponibilizado gratuitamente no endereço [https://seipro.app/ical/](https://seipro.app/ical/).

Caso deseje utilizar sua própria API de leitura, baixe os arquivos da pasta [/ICAL](/ical) e disponibilize-os um servidor de dados PHP. Aponte para o domínio criado nas configurações da Agenda: Aba Bases de Agenda >> Campo URL do serviço de integração. É indispensável a utilização de um endereço externo via protocolo https.
