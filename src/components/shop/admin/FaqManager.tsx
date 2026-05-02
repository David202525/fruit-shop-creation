import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  keywords: string[];
  is_active: boolean;
}

interface FaqManagerProps {
  faqs: FAQ[];
  onSaveFaq: (faq: { question: string; answer: string; keywords: string }) => void;
  onUpdateFaq: (faq: FAQ) => void;
  onDeleteFaq: (faqId: number) => void;
}

export default function FaqManager({
  faqs,
  onSaveFaq,
  onUpdateFaq,
  onDeleteFaq,
}: FaqManagerProps) {
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', keywords: '' });

  const handleSaveFaq = () => {
    onSaveFaq(newFaq);
    setNewFaq({ question: '', answer: '', keywords: '' });
  };

  const handleUpdateFaq = (faq: FAQ) => {
    onUpdateFaq(faq);
    setEditingFaq(null);
  };

  const handleToggleActive = (faq: FAQ) => {
    onUpdateFaq({ ...faq, is_active: !faq.is_active });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Создать новый FAQ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Вопрос"
            value={newFaq.question}
            onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
          />
          <Textarea
            placeholder="Ответ"
            value={newFaq.answer}
            onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
            rows={3}
          />
          <Input
            placeholder="Ключевые слова (через запятую)"
            value={newFaq.keywords}
            onChange={(e) => setNewFaq({ ...newFaq, keywords: e.target.value })}
          />
          <Button onClick={handleSaveFaq} disabled={!newFaq.question || !newFaq.answer}>
            <Icon name="Plus" size={16} className="mr-2" />
            Создать FAQ
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список FAQ ({faqs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {faqs.map((faq) => (
              <div key={faq.id} className="border rounded p-3">
                {editingFaq?.id === faq.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editingFaq.question || ''}
                      onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                    />
                    <Textarea
                      value={editingFaq.answer || ''}
                      onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                      rows={3}
                    />
                    <Input
                      placeholder="Ключевые слова (через запятую)"
                      value={Array.isArray(editingFaq.keywords) ? editingFaq.keywords.join(', ') : (editingFaq.keywords || '')}
                      onChange={(e) =>
                        setEditingFaq({
                          ...editingFaq,
                          keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean),
                        })
                      }
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdateFaq(editingFaq)}>
                        Сохранить
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingFaq(null)}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold">{faq.question}</div>
                      <Badge variant={faq.is_active ? 'default' : 'secondary'}>
                        {faq.is_active ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">{faq.answer}</div>
                    {Array.isArray(faq.keywords) && faq.keywords.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {faq.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingFaq(faq)}>
                        <Icon name="Edit" size={14} className="mr-1" />
                        Редактировать
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(faq)}
                      >
                        {faq.is_active ? 'Деактивировать' : 'Активировать'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteFaq(faq.id)}
                      >
                        <Icon name="Trash2" size={14} className="mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}