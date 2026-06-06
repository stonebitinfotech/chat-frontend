import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articleAPI } from '../../services/api';
import { formatRelative } from '../../utils/helpers';
import toast from 'react-hot-toast';

const BLANK = { title: '', content: '', excerpt: '', category: 'General', isPublished: true, order: 0 };

export default function Articles() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [viewArticle, setViewArticle] = useState(null);
  const [filterCat, setFilterCat] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['articles'], queryFn: () => articleAPI.getAll() });
  const articles = data?.data || [];
  const categories = [...new Set(articles.map(a => a.category))];

  const saveMutation = useMutation({
    mutationFn: (d) => editing?._id ? articleAPI.update(editing._id, d) : articleAPI.create(d),
    onSuccess: () => {
      toast.success(editing?._id ? 'Article updated' : 'Article created');
      setEditing(null);
      setForm(BLANK);
      qc.invalidateQueries(['articles']);
    },
    onError: err => toast.error(err.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: articleAPI.delete,
    onSuccess: () => { toast.success('Article deleted'); qc.invalidateQueries(['articles']); },
  });

  const togglePublish = (article) =>
    saveMutation.mutate({ ...article, isPublished: !article.isPublished });

  const startEdit = (article) => {
    setEditing(article);
    setForm({ title: article.title, content: article.content, excerpt: article.excerpt, category: article.category, isPublished: article.isPublished, order: article.order });
    setViewArticle(null);
  };

  const filtered = filterCat ? articles.filter(a => a.category === filterCat) : articles;

  if (viewArticle) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button onClick={() => setViewArticle(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to articles
        </button>
        <div className="card p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-blue text-xs">{viewArticle.category}</span>
            {!viewArticle.isPublished && <span className="badge badge-gray text-xs">Draft</span>}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{viewArticle.title}</h1>
          <p className="text-xs text-gray-400 mb-6">{formatRelative(viewArticle.updatedAt)}</p>
          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
            {viewArticle.content}
          </div>
        </div>
      </div>
    );
  }

  if (editing !== null) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button onClick={() => { setEditing(null); setForm(BLANK); }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">{editing?._id ? 'Edit Article' : 'New Article'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Article title..." required />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Getting Started" />
            </div>
            <div>
              <label className="label">Order (lower = first)</label>
              <input type="number" className="input" value={form.order} onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Short Description (shown in list)</label>
              <input className="input" value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} placeholder="One-line summary shown in widget..." />
            </div>
            <div className="col-span-2">
              <label className="label">Content</label>
              <textarea className="input resize-none text-sm font-mono" rows={16} value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                placeholder="Write article content here. You can use plain text or HTML..." />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Published (visible in widget)</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => saveMutation.mutate(form)} className="btn-primary" disabled={!form.title || !form.content || saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Article'}
            </button>
            <button onClick={() => { setEditing(null); setForm(BLANK); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Help Articles</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{articles.length} articles · Shown in the widget Articles tab</p>
        </div>
        <button onClick={() => { setEditing({}); setForm(BLANK); }} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          New Article
        </button>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setFilterCat('')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!filterCat ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>All</button>
          {categories.map(c => (
            <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterCat === c ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>{c}</button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          <p className="text-gray-500 dark:text-gray-400 mb-3">No articles yet</p>
          <button onClick={() => { setEditing({}); setForm(BLANK); }} className="btn-primary text-sm">Create your first article</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Article</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Views</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Updated</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(article => (
                <tr key={article._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => setViewArticle(article)} className="text-left group">
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{article.title}</p>
                      {article.excerpt && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{article.excerpt}</p>}
                    </button>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="badge badge-blue text-xs">{article.category}</span></td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <button onClick={() => togglePublish(article)} className={`badge text-xs cursor-pointer hover:opacity-80 ${article.isPublished ? 'badge-green' : 'badge-gray'}`}>
                      {article.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">{article.views || 0}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-400">{formatRelative(article.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(article)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                      <button onClick={() => { if (confirm('Delete this article?')) deleteMutation.mutate(article._id); }} className="text-xs text-red-500 hover:text-red-600 font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
