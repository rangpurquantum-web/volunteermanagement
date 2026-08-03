import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Topbar from '../../components/Topbar';
import { api, getSession } from '../../lib/api';

export default function AnnouncementDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [session, setSession] = useState(null);
  const [announcement, setAnnouncement] = useState(null);
  const [replies, setReplies] = useState([]);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState(null); // parent reply id for nested reply
  const [error, setError] = useState('');

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    setSession(s);
  }, []);

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function load() {
    try {
      const data = await api.getAnnouncement(id);
      setAnnouncement(data.announcement);
      setReplies(data.replies);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReply(e) {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await api.replyToAnnouncement(id, content, replyTo);
      setContent('');
      setReplyTo(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!session || !announcement) return null;

  const topLevel = replies.filter((r) => !r.parent_reply_id);
  const childrenOf = (parentId) => replies.filter((r) => r.parent_reply_id === parentId);

  function ReplyNode({ reply }) {
    return (
      <div className="reply">
        <strong>{reply.author_name}</strong>
        <p style={{ margin: '4px 0' }}>{reply.content}</p>
        <a style={{ fontSize: 12, cursor: 'pointer' }} onClick={() => setReplyTo(reply.id)}>থ্রেডে রিপ্লাই দিন</a>
        {childrenOf(reply.id).map((child) => <ReplyNode key={child.id} reply={child} />)}
      </div>
    );
  }

  return (
    <div>
      <Topbar />
      <div className="container">
        {error && <div className="error">{error}</div>}

        <div className="card">
          <h2>{announcement.title}</h2>
          <p className="muted">{announcement.author_name} · {new Date(announcement.created_at).toLocaleString('bn-BD')}</p>
          <p>{announcement.content}</p>
        </div>

        <div className="card">
          <h3>থ্রেড আলোচনা</h3>
          {topLevel.length === 0 && <p className="muted">এখনও কোনো রিপ্লাই নেই।</p>}
          {topLevel.map((r) => <ReplyNode key={r.id} reply={r} />)}

          <form onSubmit={handleReply} style={{ marginTop: 16 }}>
            {replyTo && (
              <p className="muted">
                থ্রেডে রিপ্লাই দিচ্ছেন —{' '}
                <a style={{ cursor: 'pointer' }} onClick={() => setReplyTo(null)}>বাতিল করুন</a>
              </p>
            )}
            <textarea rows={2} value={content} onChange={(e) => setContent(e.target.value)} placeholder="আপনার মন্তব্য লিখুন..." />
            <button className="btn" type="submit">রিপ্লাই পাঠান</button>
          </form>
        </div>
      </div>
    </div>
  );
}
