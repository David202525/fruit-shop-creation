import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const blockingRules = [
  {
    icon: 'Ban',
    title: 'Мошенничество и обман',
    desc: 'Использование поддельных данных, чужих платёжных реквизитов, оформление заказов без намерения оплатить.',
  },
  {
    icon: 'AlertTriangle',
    title: 'Злоупотребление акциями',
    desc: 'Создание нескольких аккаунтов для получения бонусов, обход ограничений системы лояльности.',
  },
  {
    icon: 'MessageSquareX',
    title: 'Оскорбительное поведение',
    desc: 'Грубость, угрозы или неуважительное обращение к сотрудникам питомника и другим клиентам.',
  },
  {
    icon: 'ShieldAlert',
    title: 'Нарушение правил возврата',
    desc: 'Систематические необоснованные возвраты, введение в заблуждение относительно состояния товара.',
  },
  {
    icon: 'UserX',
    title: 'Передача доступа третьим лицам',
    desc: 'Продажа или передача аккаунта, использование учётной записи для коммерческих целей без согласования.',
  },
];

const Footer = () => {
  const [showRules, setShowRules] = useState(false);

  return (
    <footer className="bg-primary text-primary-foreground mt-auto">

      {/* Правила блокировки */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => setShowRules(v => !v)}
            className="w-full flex items-center justify-between gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            <span className="flex items-center gap-2">
              <Icon name="ShieldAlert" size={15} />
              Правила блокировки аккаунта
            </span>
            <Icon name={showRules ? 'ChevronUp' : 'ChevronDown'} size={15} />
          </button>

          {showRules && (
            <div className="mt-4 space-y-3 pb-2">
              <p className="text-xs opacity-60 leading-relaxed">
                Администрация оставляет за собой право заблокировать профиль без предупреждения в следующих случаях:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {blockingRules.map((rule) => (
                  <div
                    key={rule.title}
                    className="flex gap-3 bg-primary-foreground/5 border border-primary-foreground/10 rounded-xl p-3"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <Icon name={rule.icon as Parameters<typeof Icon>[0]['name']} size={16} className="opacity-70" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold opacity-90">{rule.title}</p>
                      <p className="text-xs opacity-60 mt-0.5 leading-relaxed">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs opacity-50 leading-relaxed">
                При блокировке активные заказы не аннулируются. По вопросам разблокировки обращайтесь через форму обратной связи.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Основной футер */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-6 pb-24 md:pb-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm w-full">
              <Link 
                to="/privacy-policy" 
                className="hover:underline opacity-90 hover:opacity-100 transition text-center whitespace-nowrap"
              >
                Политика конфиденциальности
              </Link>
              <span className="opacity-50">•</span>
              <Link 
                to="/terms" 
                className="hover:underline opacity-90 hover:opacity-100 transition text-center whitespace-nowrap"
              >
                Пользовательское соглашение
              </Link>
              <span className="opacity-50">•</span>
              <Link 
                to="/delivery-and-return" 
                className="hover:underline opacity-90 hover:opacity-100 transition text-center whitespace-nowrap"
              >
                Доставка и возврат
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs md:text-sm opacity-75 text-center">
              <span className="font-medium whitespace-nowrap">ИП Бояринцев Вадим Вячеславович</span>
              <span className="opacity-50">•</span>
              <span className="whitespace-nowrap">ИНН: 222261894107</span>
              <span className="opacity-50">•</span>
              <p className="flex items-center gap-2 whitespace-nowrap">
                <Icon name="Flower2" size={16} />
                © 2024 Питомник растений
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
