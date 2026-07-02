/**
 * @license
 * Copyright 2026 Supernodes
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button, List, Message, Typography } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

type Document = {
  id: string;
  title: string;
  content: string;
  conversation_id: string;
  created_by_agent: string;
  created_at: number;
  updated_at: number;
};

const DocumentsPage: React.FC = () => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: selectedDoc?.content || '',
    onUpdate: () => {},
  });

  const loadDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/supernodes/documents');
      if (!res.ok) return;
      setDocuments((await res.json()) as Document[]);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (editor && selectedDoc) {
      editor.commands.setContent(selectedDoc.content);
    }
  }, [selectedDoc, editor]);

  const saveDocument = async () => {
    if (!selectedDoc || !editor) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/supernodes/documents/${selectedDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editor.getHTML() }),
      });
      if (res.ok) {
        Message.success(t('documents.saved'));
        void loadDocuments();
      } else {
        Message.error(t('documents.saveFailed'));
      }
    } catch {
      Message.error(t('documents.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='flex h-full p-20px gap-20px'>
      <div className='w-300px border-r border-[var(--color-border-2)] pr-20px shrink-0'>
        <Title heading={5}>{t('documents.listTitle')}</Title>
        <List
          dataSource={documents}
          render={(doc) => (
            <List.Item
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              style={{
                cursor: 'pointer',
                background: selectedDoc?.id === doc.id ? 'var(--color-fill-2)' : 'transparent',
              }}
            >
              <List.Item.Meta
                title={doc.title}
                description={t('documents.createdBy', {
                  agent: doc.created_by_agent || 'Agent',
                  date: new Date(doc.created_at).toLocaleDateString(),
                })}
              />
            </List.Item>
          )}
        />
      </div>

      <div className='flex-1 min-w-0'>
        {selectedDoc ? (
          <>
            <div className='flex items-center gap-12px mb-12px'>
              <Title heading={5} style={{ margin: 0 }}>
                {selectedDoc.title}
              </Title>
              <Button type='primary' loading={saving} onClick={() => void saveDocument()}>
                {t('documents.save')}
              </Button>
            </div>
            <div className='border border-[var(--color-border-2)] rd-8px p-20px min-h-400px'>
              <EditorContent editor={editor} />
            </div>
          </>
        ) : (
          <Text type='secondary'>{t('documents.empty')}</Text>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
