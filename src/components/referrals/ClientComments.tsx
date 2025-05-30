import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Comment {
  authorId: string;
  authorRole: string;
  text: string;
  createdAt: string;
}

export function ClientComments({ clientId }: { clientId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/comments?clientId=${clientId}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      setError('Could not load comments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/clients/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, text: newComment.trim() }),
      });
      if (!res.ok) throw new Error('Failed to post comment');
      setNewComment('');
      fetchComments();
    } catch (err) {
      setError('Could not post comment.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments & Updates</h3>
      {loading ? (
        <div className="text-muted-foreground">Loading comments...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : comments.length === 0 ? (
        <div className="text-muted-foreground">No comments yet.</div>
      ) : (
        <div className="space-y-3">
          {comments.map((c, i) => (
            <div key={i} className="rounded-lg border p-3 bg-gray-50">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span className="font-medium">{c.authorRole}</span>
                <span>•</span>
                <span>{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <div className="text-gray-800 whitespace-pre-line">{c.text}</div>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handlePost} className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment or update..."
          rows={2}
          className="resize-none flex-1"
        />
        <Button type="submit" disabled={posting || !newComment.trim()} className="self-end">
          {posting ? 'Posting...' : 'Post Comment'}
        </Button>
      </form>
    </div>
  );
} 