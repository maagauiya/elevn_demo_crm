# Реестр разделов

> Сгенерировано `pnpm metadata:sync` из меню локального бэкенда (пользователь DemoOpatra).
> Не редактируй руками ничего, кроме колонки «Статус»: она сохраняется между запусками.
> Статусы: пусто — не начато, 🚧 — в работе, ✅ — готово и проверено на локальном бэкенде.

Разделы рисуются движками: один движок закрывает все пункты своего типа. Отдельные экраны
пишутся только для движков logbook, offices, training, work-schedule и kanban.

| Движок | Пунктов |
| --- | --- |
| table | 178 |
| dashboard | 9 |
| chart | 4 |
| logbook | 1 |
| offices | 1 |
| work-schedule | 1 |
| training | 1 |
| kanban | 1 |

| WANAVID | Раздел | Тип | Движок | Трек | Маршрут | Метод данных | Статус |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 63 | Расход товаров на событие (скрыт для роли) | 1 | table | B | /info/100 | `WAGetSOSOAByApp` |  |
| 86 | История взаимодействия с клиентом (скрыт для роли) | 1 | table | B | /info/122 | `WAReportClientHistory` |  |
| 87 | Услуги курса (скрыт для роли) | 1 | table | B | /info/123 | `WAReportCourseManipulationBC` |  |
| 88 | Оплаты курса (скрыт для роли) | 1 | table | B | /info/124 | `WAReportCoursePaymentBC` |  |
| 122 | Услуги клиента (скрыт для роли) | 1 | table | B | /info/167 | `WAReportClientManipulation` |  |
| 213 | Услуги события (скрыт для роли) | 1 | table | B | /info/249 | `WAReportManipulationByApp` |  |
| 193 | Исследование клиента (скрыт для роли) | 6 | dashboard | A | /dashboard/229 | — |  |
| 189 | По сертификатам - Детализация (скрыт для роли) | 1 | table | B | /info/216 | `WAReportCertificateNNDet` |  |
| 1 | Расписание | -1 | logbook | A | /logbook | — |  |
| 129 | Расписание по кабинетам | -10 | offices | A | /offices | — |  |
| 54 | Справочники › Филиалы | 1 | table | B | /info/65 | `WAGetCompanyList` |  |
| 3 | Справочники › Клиенты | 7 | table | B | /info/4 | `WAGetClientList` |  |
| 4 | Справочники › Специалисты | 1 | table | B | /info/1 | `WaGetDoctorList` |  |
| 5 | Справочники › Услуги | 1 | table | B | /info/5 | `WAGetManipList` |  |
| 53 | Справочники › График работы | -2 | work-schedule | A | /work_schedule | `WATTGetTree` |  |
| 114 | Справочники › График онлайн-записи | 1 | table | B | /info/158 | `WAReportTTIsORDay` |  |
| 72 | Справочники › Кабинеты | 1 | table | B | /info/110 | `WAGetCabinetList` |  |
| 85 | Справочники › Оборудование | 1 | table | B | /info/121 | `WAGetEquipmentList` |  |
| 109 | Справочники › Подразделения | 1 | table | B | /info/152 | `WAGetDepartmentList` |  |
| 110 | Справочники › Сертификаты | 1 | table | B | /info/154 | `WAGetDictCertSaleList` |  |
| 111 | Справочники › Группы клиентов | 1 | table | B | /info/155 | `WAGetClientGroupList` |  |
| 123 | Справочники › Категории специалистов | 1 | table | B | /info/168 | `WAGetDoctorLevelList` |  |
| 184 | Справочники › Источники рекламы | 1 | table | B | /info/204 | `WAGetReklamaList` |  |
| 206 | Справочники › Должности | 1 | table | B | /info/244 | `WAGetPositionList` |  |
| 8 | Система лояльности › Карты лояльности | 1 | table | B | /info/72 | `WAGetCardTypeList` |  |
| 9 | Система лояльности › Накопительная система | 1 | table | B | /info/73 | `WAGetCardAccumulationList` |  |
| 10 | Система лояльности › Сезонные акции | 1 | table | B | /info/28 | `WAGetActionsList` |  |
| 11 | Система лояльности › Разовые акции | 1 | table | B | /info/74 | `WAGetDictDiscountList` |  |
| 201 | Система лояльности › Реферальные программы | 1 | table | B | /info/239 | `WAGetRefProgramList` |  |
| 202 | Система лояльности › Промокоды | 1 | table | B | /info/240 | `WAReportRefProgramCode` |  |
| 204 | Система лояльности › Плавающие скидки | 1 | table | B | /info/242 | `WAGetOptionsVarDiscountList` |  |
| 221 | Система лояльности › Отложенные подарки | 1 | table | B | /info/256 | `WAGetManipDBonusRuleList` |  |
| 13 | Рассылки › Список рассылок | 1 | table | B | /info/83 | `WAGetMSGGroupList` |  |
| 14 | Рассылки › Рассылка по активным клиентам | 1 | table | B | /info/84 | `WAReportMSGActClient` |  |
| 15 | Рассылки › Рассылка по потерянным клиентам | 1 | table | B | /info/85 | `WAReportMSGLostClient` |  |
| 16 | Рассылки › Рассылка - сравнение периодов | 1 | table | B | /info/87 | `WAReportMSGCompare` |  |
| 17 | Рассылки › Отправленные сообщения | 1 | table | B | /info/86 | `WAReportMSGSent` |  |
| 112 | Рассылки › Справочник тегов для сообщений | 1 | table | B | /info/156 | `WAGetMSGPatternPHList` |  |
| 153 | Рассылки › Эффективность рассылок | 1 | table | B | /info/171 | `WAReportMSGEfficiency` |  |
| 180 | Аналитика › Общие › Список дел | 1 | table | B | /info/163 | `WAReportToDo` |  |
| 71 | Аналитика › Общие › График работы по дням (на печать) | 1 | table | B | /info/109 | `WAReportTimetable` |  |
| 39 | Аналитика › Общие › Услуги | 1 | table | B | /info/6 | `WAReportManip` |  |
| 124 | Аналитика › Общие › Услуги (сегодня) (скрыт для роли) | 1 | table | B | /info/8 | `WAReportManipDaily` |  |
| 126 | Аналитика › Общие › Мои оказанные услуги (скрыт для роли) | 1 | table | B | /info/11 | `MobGetReportServices` |  |
| 40 | Аналитика › Общие › Продажи | 1 | table | B | /info/7 | `WAReportMat` |  |
| 125 | Аналитика › Общие › Продажи (сегодня) (скрыт для роли) | 1 | table | B | /info/9 | `WAReportMatDaily` |  |
| 127 | Аналитика › Общие › Мои продажи (скрыт для роли) | 1 | table | B | /info/12 | `MobGetReportSales` |  |
| 128 | Аналитика › Общие › Мои предстоящие записи на сегодня (скрыт для роли) | 1 | table | B | /info/13 | `MobDocSchedT` |  |
| 197 | Аналитика › Общие › Клиенты | 1 | table | B | /info/233 | `WAReportClient` |  |
| 55 | Аналитика › Общие › Продажи сертификатов | 1 | table | B | /info/88 | `WAReportCertificate` |  |
| 192 | Аналитика › Общие › Продажи онлайн | 1 | table | B | /info/219 | `WAReportOS` |  |
| 64 | Аналитика › Общие › Долги клиентов | 1 | table | B | /info/101 | `WAReportClientDolg` |  |
| 73 | Аналитика › Общие › По подразделениям | 1 | table | B | /info/113 | `WAReportDepartment` |  |
| 83 | Аналитика › Общие › Оплаты за товары | 1 | table | B | /info/119 | `WAReportMaterialPayment` |  |
| 84 | Аналитика › Общие › Оплаты за услуги | 1 | table | B | /info/120 | `WAReportManipulationPayment` |  |
| 115 | Аналитика › Общие › Операции с бонусами | 1 | table | B | /info/159 | `WAReportBonusDetails` |  |
| 209 | Аналитика › Общие › Ближайшие сгорания бонусов | 1 | table | B | /info/246 | `WAReportBurnList` |  |
| 121 | Аналитика › Общие › Загрузка оборудования | 1 | table | B | /info/166 | `WAReportEquipment` |  |
| 176 | Аналитика › Общие › Рейтинг услуг | 1 | table | B | /info/195 | `WAReportManipRating` |  |
| 177 | Аналитика › Общие › Услуги по специалистам | 1 | table | B | /info/196 | `WAReportDoctorManip` |  |
| 38 | Аналитика › Касса › Наличная касса | 10 | table | B | /info/2 | `WAReportCassa` |  |
| 150 | Аналитика › Касса › Наличная касса (сегодня) (скрыт для роли) | 1 | table | B | /info/10 | `WAReportCassaDaily` |  |
| 58 | Аналитика › Касса › Операции с депозитами | 1 | table | B | /info/91 | `WAReportDepositDetails` |  |
| 59 | Аналитика › Касса › Движения денежных средств | 1 | table | B | /info/92 | `WAReportDDSOperations` |  |
| 68 | Аналитика › Касса › Чеки ККМ за события | 1 | table | B | /info/105 | `WAReportKKMLog` |  |
| 70 | Аналитика › Касса › Чеки ККМ за другое | 1 | table | B | /info/107 | `WAReportKKMLogNonApp` |  |
| 178 | Аналитика › Касса › Выручка предприятия | 1 | table | B | /info/197 | `WAReportCompanySP` |  |
| 185 | Аналитика › Касса › Наличная касса по дням | 1 | table | B | /info/205 | `WAReportDailyCassaMonth` |  |
| 187 | Аналитика › Касса › Аналитика деятельности предприятия (скрыт для роли) | 1 | table | B | /info/214 | `WAReportAnalysis` |  |
| 42 | Аналитика › Зарплата › Зарплата специалистов (подробный) | 1 | table | B | /info/70 | `WAReportDoctorIncomeDet` |  |
| 220 | Аналитика › Зарплата › Зарплата специалистов (подробный) – с налогом (скрыт для роли) | 1 | table | B | /info/255 | `WAReportDoctorIncomeNDet` |  |
| 60 | Аналитика › Зарплата › Выплаты специалистам | 1 | table | B | /info/93 | `WAReportDoctorIncomePay` |  |
| 61 | Аналитика › Зарплата › Рейтинг специалистов | 1 | table | B | /info/98 | `WAReportDoctorRating` |  |
| 41 | Аналитика › Зарплата › Зарплата специалистов | 1 | table | B | /info/69 | `WAReportDoctorIncome` |  |
| 219 | Аналитика › Зарплата › Зарплата специалистов – с налогом (скрыт для роли) | 1 | table | B | /info/254 | `WAReportDoctorIncomeN` |  |
| 62 | Аналитика › Маркетинг › Первичные клиенты | 1 | table | B | /info/99 | `WAReportNewClientsDetail` |  |
| 226 | Аналитика › Маркетинг › Источники рекламы | 1 | table | B | /info/263 | `WAReportReklama` |  |
| 65 | Аналитика › Маркетинг › Статистика звонков | 1 | table | B | /info/102 | `WAReportCallStatistic` |  |
| 67 | Аналитика › Маркетинг › Клиенты именинники | 1 | table | B | /info/104 | `WAReportBirthDates` |  |
| 69 | Аналитика › Маркетинг › Возвратность клиентов | 1 | table | B | /info/106 | `WAReportClientReturnByDoc` |  |
| 76 | Аналитика › Маркетинг › По разовым акциям | 1 | table | B | /info/116 | `WAReportDictDiscount` |  |
| 113 | Аналитика › Маркетинг › По разовым акциям (подробный) | 1 | table | B | /info/157 | `WAReportDictDiscountDet` |  |
| 77 | Аналитика › Маркетинг › По сезонным акциям | 1 | table | B | /info/117 | `WAReportAction` |  |
| 89 | Аналитика › Маркетинг › ABC по клиентам | 1 | table | B | /info/125 | `WAReportABCClient` |  |
| 90 | Аналитика › Маркетинг › ABC по услугам | 1 | table | B | /info/126 | `WAReportABCManip` |  |
| 91 | Аналитика › Маркетинг › ABC по товарам | 1 | table | B | /info/127 | `WAReportABCMat` |  |
| 92 | Аналитика › Маркетинг › XYZ по клиентам | 1 | table | B | /info/128 | `WAReportXYZClient` |  |
| 93 | Аналитика › Маркетинг › Перекрестный анализ по клиентам | 1 | table | B | /info/129 | `WAReportABCXYZClient` |  |
| 117 | Аналитика › Маркетинг › Предполагаемая выручка | 1 | table | B | /info/161 | `WAReportPossibleIncome` |  |
| 152 | Аналитика › Маркетинг › Отзывы клиентов (специалисты) | 1 | table | B | /info/170 | `WAReportClientReview` |  |
| 167 | Аналитика › Маркетинг › Отзывы клиентов (визиты) | 1 | table | B | /info/182 | `WAReportClientReviewVisit` |  |
| 173 | Аналитика › Маркетинг › Визиты по предзаписи | 1 | table | B | /info/186 | `WAReportVisitOnChain` |  |
| 45 | Аналитика › Дашборды › Подробная информация | 6 | dashboard | A | /dashboard/60 | — |  |
| 94 | Аналитика › Дашборды › Выручка по специалистам (график) | 3 | chart | A | /chart/136 | `WAChartProceedsDepDoc` |  |
| 95 | Аналитика › Дашборды › Возвратность по специалистам (график) | 3 | chart | A | /chart/137 | `WAChartNewClientDepDoc` |  |
| 96 | Аналитика › Дашборды › Первичные клиенты и возвратность (график) | 3 | chart | A | /chart/138 | `WAChartNewRetClientDouble` |  |
| 97 | Аналитика › Дашборды › Обработка звонков - первичные (график) | 3 | chart | A | /chart/139 | `WAChartCallNewClients` |  |
| 98 | Аналитика › Дашборды › Выручка по группам услуг | 6 | dashboard | A | /dashboard/142 | — |  |
| 183 | Аналитика › Дашборды › Выручка по услугам | 6 | dashboard | A | /dashboard/203 | — |  |
| 175 | Аналитика › Дашборды › Бонусы и скидки | 6 | dashboard | A | /dashboard/194 | — |  |
| 186 | Аналитика › Дашборды › Онлайн записи | 6 | dashboard | A | /dashboard/213 | — |  |
| 120 | Аналитика › Контроль › Журнал действий | 1 | table | B | /info/165 | `WAReportWALog` |  |
| 169 | Аналитика › Контроль › Контроль закрытия смен | 1 | table | B | /info/183 | `WAReportDayclose` |  |
| 57 | Аналитика › Курсы › Курсы - оплаты | 1 | table | B | /info/90 | `WAReportCoursePayment` |  |
| 171 | Аналитика › Курсы › Долги по курсам | 1 | table | B | /info/184 | `WAReportCourseDolg` |  |
| 172 | Аналитика › Курсы › Заканчивающиеся курсы | 1 | table | B | /info/185 | `WAReportCourseFinishing` |  |
| 191 | Аналитика › Курсы › Остаток услуг по курсам (на дату) | 1 | table | B | /info/218 | `WAReportCourseManipRest` |  |
| 47 | Настройки › Основные настройки | 1 | table | B | /info/63 | `WAGetOptionsList` |  |
| 48 | Настройки › Онлайн запись | 1 | table | B | /info/26 | `WAGetOOList` |  |
| 224 | Настройки › Рекомендация услуг (онлайн) | 1 | table | B | /info/259 | `WAGetOrRecManipByGroupList` |  |
| 210 | Настройки › Моб. приложение (клиентам) | 1 | table | B | /info/247 | `WAGetCMobOptionsList` |  |
| 49 | Настройки › Бонусная система | 1 | table | B | /info/71 | `WAGetOBList` |  |
| 200 | Настройки › Реферальная система | 1 | table | B | /info/238 | `WAGetRefOptionsList` |  |
| 50 | Настройки › Пользователи | 1 | table | B | /info/62 | `WAGetUserList` |  |
| 190 | Настройки › Уровни доступа | 1 | table | B | /info/217 | `WAGetEmployeeRoleList` |  |
| 51 | Настройки › Настройки сообщений | 1 | table | B | /info/81 | `WAGetOMSGList` |  |
| 52 | Настройки › Шаблоны сообщений | 1 | table | B | /info/82 | `WAGetMSGPatternList` |  |
| 118 | Настройки › АТС Коннекторы | 1 | table | B | /info/162 | `WAGetATSConnectorList` |  |
| 119 | Настройки › Инстансы отправки сообщений | 1 | table | B | /info/164 | `WAGetMSGInstanceList` |  |
| 174 | Настройки › Прогрессивная зарплата | 1 | table | B | /info/187 | `WAGetSalaryProgressList` |  |
| 179 | Настройки › Шаблоны расписания | 1 | table | B | /info/198 | `WAGetScheduleTemplateList` |  |
| 196 | Настройки › Маски телефонов | 1 | table | B | /info/232 | `WAGetPhonePrefixDictList` |  |
| 198 | Настройки › Типы уведомлений | 1 | table | B | /info/236 | `WAGetNotificationTypeList` |  |
| 199 | Настройки › Шаблоны графика работы | 1 | table | B | /info/237 | `WAGetTimeTableTemplateList` |  |
| 203 | Настройки › Логирование | 1 | table | B | /info/241 | `WAGetLogActionTypeList` |  |
| 135 | Медицинский блок › Справочники › Медкарты | 7 | table | B | /info/61 | `WAGetMedcardList` |  |
| 137 | Медицинский блок › Справочники › Личные протоколы | 1 | table | B | /info/153 | `WAGetTemplateList` |  |
| 136 | Медицинский блок › Справочники › Шаблоны планов лечения | 1 | table | B | /info/80 | `WAGetDictTreatplanList` |  |
| 138 | Медицинский блок › Лаборатории › Лаборатории | 1 | table | B | /info/76 | `WAGetLaboratoryList` |  |
| 139 | Медицинский блок › Лаборатории › Активные заявки | 1 | table | B | /info/77 | `WAGetLabreqeustListAct` |  |
| 140 | Медицинский блок › Лаборатории › Заявки к оплате | 1 | table | B | /info/78 | `WAGetLabreqeustListOP` |  |
| 141 | Медицинский блок › Лаборатории › Закрытые заявки | 1 | table | B | /info/79 | `WAGetLabreqeustListClosed` |  |
| 142 | Медицинский блок › Страховые › Страховые компании | 1 | table | B | /info/130 | `WAGetInsuranceList` |  |
| 143 | Медицинский блок › Страховые › Договоры со страховыми компаниями | 1 | table | B | /info/131 | `WAGetInsuranCecontractList` |  |
| 144 | Медицинский блок › Страховые › Страховые программы | 1 | table | B | /info/132 | `WAGetInsuranceProgramList` |  |
| 145 | Медицинский блок › Отчеты › Планы лечения | 1 | table | B | /info/112 | `WAReportTreatPlan` |  |
| 147 | Медицинский блок › Отчеты › По страховым клиентам | 1 | table | B | /info/133 | `WAReportINSPClient` |  |
| 148 | Медицинский блок › Отчеты › По страховым процедурам | 1 | table | B | /info/134 | `WAReportINSPManipulation` |  |
| 222 | Медицинский блок › Отчеты › Реестр по ДМС | 1 | table | B | /info/257 | `WAReportInspManipulationDMS` |  |
| 149 | Медицинский блок › Отчеты › Рентабельность страховых компаний | 1 | table | B | /info/135 | `WAReportInsuranceProfit` |  |
| 146 | Медицинский блок › Отчеты › Контроль записей | 6 | dashboard | A | /dashboard/97 | — |  |
| 151 | Медицинский блок › Отчеты › По записям специалистов | 1 | table | B | /info/169 | `WAReportMedcardRecords` |  |
| 101 | Задачи › План работ на сегодня | 1 | table | B | /info/144 | `WACWGetWorkToday` |  |
| 102 | Задачи › Просроченные задачи | 1 | table | B | /info/145 | `WACWGetWorkExpired` |  |
| 103 | Задачи › Задачи - скоро | 1 | table | B | /info/146 | `WACWGetWorkSoon` |  |
| 104 | Задачи › Выполненные задачи | 1 | table | B | /info/147 | `WACWGetWorkDone` |  |
| 105 | Задачи › Все задачи | 1 | table | B | /info/148 | `WACWGetWorkList` |  |
| 106 | Задачи › Задачи - скоро (все сотрудники) | 1 | table | B | /info/149 | `WACWGetWorkSoonAll` |  |
| 107 | Задачи › Просроченные задачи (все сотрудники) | 1 | table | B | /info/150 | `WACWGetWorkExpiredAll` |  |
| 108 | Задачи › Выполненные задачи (все сотрудники) | 1 | table | B | /info/151 | `WACWGetWorkDoneAll` |  |
| 225 | Задачи › Конверсия задач в запись | 6 | dashboard | A | /dashboard/262 | — |  |
| 160 | Фитнес › Расписание групповых занятий | -100 | training | A | /training | — |  |
| 156 | Фитнес › Справочники › Абонементы | 1 | table | B | /info/172 | `WAGetDictsubscriptionList` |  |
| 157 | Фитнес › Справочники › Абонементы (продажи) | 1 | table | B | /info/173 | `WAGetSubscriptionList` |  |
| 194 | Фитнес › Справочники › Условия аренды | 1 | table | B | /info/230 | `WAGetRentalTermList` |  |
| 159 | Фитнес › Отчеты › Посещения по абонементам | 1 | table | B | /info/174 | `WAReportSubscriptionVisit` |  |
| 161 | Фитнес › Отчеты › Продажи абонементов | 1 | table | B | /info/176 | `WAReportSubscriptionSale` |  |
| 162 | Фитнес › Отчеты › Оплаты за абонементы | 1 | table | B | /info/177 | `WAReportSubscriptionPayment` |  |
| 163 | Фитнес › Отчеты › Услуги по абонементам | 1 | table | B | /info/178 | `WAReportSubscriptionManip` |  |
| 164 | Фитнес › Отчеты › Заканчивающиеся абонементы | 1 | table | B | /info/179 | `WAReportSubscriptionFinishing` |  |
| 165 | Фитнес › Отчеты › По групповым занятиям | 1 | table | B | /info/180 | `WAReportTraining` |  |
| 166 | Фитнес › Отчеты › По клиентам занятия (скрыт для роли) | 1 | table | B | /info/181 | `WAReportTRClientByTR` |  |
| 195 | Фитнес › Отчеты › По аренде | 1 | table | B | /info/231 | `WAReportCabinetRent` |  |
| 208 | Сделки › Сделки | 1 | table | B | /info/245 | `WAGetDealList` |  |
| 218 | Сделки › Сделки (канбан) | 12 | kanban | B | /kanban/253 | `WAKBBDeal` |  |
| 215 | Сделки › Справочники › Рекламный бюджет | 1 | table | B | /info/250 | `WAReportAdvertBudget` |  |
| 181 | Справочник ПО | 10 | table | B | /info/199 | `WAReportNavHelp` |  |
| 216 | Таргет | 1 | table | B | /info/251 | `WAReportDealMarketing` |  |
| 212 | Колл-центр | 1 | table | B | /info/248 | `WAReportDealCC` |  |
| 66 | Ресепшн | 1 | table | B | /info/103 | `WAReportAppList` |  |
| 6 | Диагностика | 1 | table | B | /info/29 | `WAGetDictCourseList` |  |
| 56 | Финансовый отдел | 1 | table | B | /info/89 | `WAReportCourse` |  |
| 217 | Координаторская | 1 | table | B | /info/252 | `WAReportDealDaily` |  |
| 20 | Склад › Справочники › Товары | 1 | table | B | /info/18 | `WAGetMatList` |  |
| 21 | Склад › Справочники › Склады | 1 | table | B | /info/19 | `WAGetStoreList` |  |
| 22 | Склад › Справочники › Технологические карты | 1 | table | B | /info/64 | `WAGetManipulationMaterialList` |  |
| 23 | Склад › Справочники › Группы товаров | 1 | table | B | /info/66 | `WAGetMaterialGroupList` |  |
| 24 | Склад › Справочники › Производители | 1 | table | B | /info/67 | `WAGetMaterialVendorList` |  |
| 25 | Склад › Справочники › Торговые марки | 1 | table | B | /info/68 | `WAGetMaterialBrandList` |  |
| 26 | Склад › Справочники › Поставщики | 1 | table | B | /info/75 | `WAGetMaterialProviderList` |  |
| 28 | Склад › Действия › Приходы | 1 | table | B | /info/20 | `WAGetSIList` |  |
| 29 | Склад › Действия › Списания | 1 | table | B | /info/21 | `WAGetSOList` |  |
| 30 | Склад › Действия › Перемещения | 1 | table | B | /info/22 | `WAGetSMList` |  |
| 31 | Склад › Действия › Инвентаризация | 1 | table | B | /info/30 | `WAGetInvList` |  |
| 33 | Склад › Отчеты › Состояние складов на дату | 1 | table | B | /info/23 | `WAReportStoreMaterial` |  |
| 34 | Склад › Отчеты › Расход товаров на услуги | 1 | table | B | /info/24 | `WAReportMaterialOutlay` |  |
| 35 | Склад › Отчеты › История операций с товаром | 1 | table | B | /info/25 | `WAReportOpWMaterial` |  |
| 74 | Склад › Отчеты › Приходы за период | 1 | table | B | /info/114 | `WAReportStoreIncome` |  |
| 75 | Склад › Отчеты › Расходы за период | 1 | table | B | /info/115 | `WAReportStoreOutcome` |  |
| 99 | Склад › Отчеты › Перемещения за период | 1 | table | B | /info/143 | `WAReportStoreMovement` |  |
| 188 | Склад › Отчеты › Инвентаризации за период | 1 | table | B | /info/215 | `WAReportInventory` |  |
| 78 | Склад › Отчеты › Движения по складу | 1 | table | B | /info/118 | `WAReportStoreSimple` |  |
| 116 | Склад › Отчеты › Продажа товаров специалистам | 1 | table | B | /info/160 | `WAReportMaterialSaleDoctor` |  |
| 182 | Склад › Отчеты › Выгрузка в 1С | 1 | table | B | /info/200 | `WAReport1CDocuments` |  |
| 223 | Сервис (скрыт для роли) | 1 | table | B | /info/258 | `WAReportAppList` |  |
| 44 | Дашборд | 6 | dashboard | A | /dashboard/46 | — |  |
