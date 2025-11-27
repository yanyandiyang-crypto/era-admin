import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CheckCircle, User, Calendar, AlertCircle } from 'lucide-react';
import { incidentService } from '@/services/incident.service';
import type { IncidentResolution } from '@/types/incident.types';
import { format } from 'date-fns';

interface ResolutionReviewProps {
  incidentId: string;
  onResolutionConfirmed?: () => void;
}

const outcomeLabels: Record<string, string> = {
  BROUGHT_TO_POLICE_STATION: 'Taken to Police Station',
  BROUGHT_TO_HOSPITAL: 'Taken to Hospital',
  RESPONDED_BY_FIREFIGHTER: 'Responded by Firefighter',
  BROUGHT_TO_BARANGAY: 'Taken to Barangay',
  RESPONDED_BY_POLICE: 'Responded by Police',
  COMMON_RESOLVED: 'Disturbance reprimanded',
  OTHER: 'Other',
};

export function ResolutionReview({ incidentId, onResolutionConfirmed }: ResolutionReviewProps) {
  const [resolution, setResolution] = useState<IncidentResolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [editData, setEditData] = useState({
    what: '',
    when: '',
    where: '',
    who: '',
    why: '',
    how: '',
    notes: '',
    adminNotes: '',
  });

  useEffect(() => {
    loadResolution();
  }, [incidentId]);

  const loadResolution = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await incidentService.getResolution(incidentId);
      
      if (response.success && response.data) {
        setResolution(response.data);
        setEditData({
          what: response.data.what,
          when: response.data.when,
          where: response.data.where,
          who: response.data.who,
          why: response.data.why,
          how: response.data.how,
          notes: response.data.notes || '',
          adminNotes: response.data.adminNotes || '',
        });
      }
    } catch (err: unknown) {
      const error = err as {response?: {status?: number}};
      if (error.response?.status === 404) {
        setError('No resolution report has been submitted yet.');
      } else {
        setError('Failed to load resolution report.');
      }
      // console.error('Error loading resolution:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdits = async () => {
    try {
      setConfirming(true);
      await incidentService.updateResolution(incidentId, editData);
      setEditing(false);
      await loadResolution();
    } catch {
      // console.error('Error updating resolution:', err);
      alert('Failed to update resolution');
    } finally {
      setConfirming(false);
    }
  };

  const handleConfirmResolution = async () => {
    if (!confirm('Are you sure you want to confirm this resolution? This will mark the incident as RESOLVED.')) {
      return;
    }

    try {
      setConfirming(true);
      await incidentService.confirmResolution(incidentId, editData.adminNotes);
      onResolutionConfirmed?.();
    } catch {
      // console.error('Error confirming resolution:', err);
      alert('Failed to confirm resolution');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !resolution) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || 'No resolution report found.'}</AlertDescription>
      </Alert>
    );
  }

  const isConfirmed = !!resolution.confirmedAt;

  return (
    <div className="space-y-4 max-w-none">
      {/* Modern Header with Blue Gradient */}
       <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-xl p-6 text-white shadow-lg relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.15),transparent_50%)] rounded-xl"></div>
          <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Resolution Report</h1>
              <p className="text-blue-100 text-sm mt-1">
                Review and confirm the personnel's resolution report
              </p>
            </div>
          </div>
          {isConfirmed ? (
            <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-green-400/30">
              <CheckCircle className="h-4 w-4 text-green-300" />
              <span className="text-green-200 font-medium text-sm">Confirmed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-yellow-400/30">
              <AlertCircle className="h-4 w-4 text-yellow-300" />
              <span className="text-yellow-200 font-medium text-sm">Pending Review</span>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Compact Submitted By Section */}
      <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300">
              {resolution.submittedByPersonnel.photo ? (
                <img
                  src={resolution.submittedByPersonnel.photo}
                  alt={`${resolution.submittedByPersonnel.firstName} ${resolution.submittedByPersonnel.lastName}`}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">
                {resolution.submittedByPersonnel.firstName} {resolution.submittedByPersonnel.lastName}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                {resolution.submittedByPersonnel.role}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
              <Calendar className="h-3 w-3" />
              {format(new Date(resolution.submittedAt), 'MMM dd, HH:mm')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modern 5W1H Report Grid */}
      <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
        {/* Blue Gradient Header */}
        <div className="relative overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-t-xl p-6 text-white mb-6 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.15),transparent_50%)] rounded-t-xl"></div>
            <div className="relative z-10 flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Personnel Resolution Report</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Detailed 5W1H report submitted by responding personnel
                  </p>
                </div>
              </div>
              {!isConfirmed && !editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="border-white/30 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Edit Report
                </Button>
              )}
              {editing && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="border-white/30 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdits} disabled={confirming} className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                    {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* What */}
          <div className="bg-gradient-to-br from-blue-50 via-blue-100/30 to-blue-50/70 p-3 rounded-xl border border-blue-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
            <Label className="text-sm font-semibold text-blue-800 flex items-center gap-4 mb-3 p-1.5 rounded-lg bg-blue-100/50 border border-blue-200/30">
              <span className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-sm">W</span>
              What happened?
            </Label>
            {editing ? (
              <Textarea
                value={editData.what}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditData({ ...editData, what: e.target.value })}
                className="text-sm resize-none"
                rows={2}
                placeholder="Describe what occurred during the incident..."
              />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{resolution.what}</p>
            )}
          </div>

          {/* When */}
          <div className="bg-gradient-to-br from-green-50 via-green-100/30 to-green-50/70 p-3 rounded-xl border border-green-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
            <Label className="text-sm font-semibold text-green-800 flex items-center gap-4 mb-3 p-1.5 rounded-lg bg-green-100/50 border border-green-200/30">
              <span className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-sm">W</span>
              When did it happen?
            </Label>
            {editing ? (
              <Input
                value={editData.when}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, when: e.target.value })}
                className="text-sm"
                placeholder="Specify the time/date of the incident..."
              />
            ) : (
              <p className="text-sm text-gray-700 font-medium">{resolution.when}</p>
            )}
          </div>

          {/* Where */}
          <div className="bg-gradient-to-br from-purple-50 via-purple-100/30 to-purple-50/70 p-3 rounded-xl border border-purple-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
            <Label className="text-sm font-semibold text-purple-800 flex items-center gap-4 mb-3 p-1.5 rounded-lg bg-purple-100/50 border border-purple-200/30">
              <span className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-sm">W</span>
              Where did it happen?
            </Label>
            {editing ? (
              <Input
                value={editData.where}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, where: e.target.value })}
                className="text-sm"
                placeholder="Location details..."
              />
            ) : (
              <p className="text-sm text-gray-700 font-medium">{resolution.where}</p>
            )}
          </div>

          {/* Who */}
          <div className="bg-gradient-to-br from-orange-50 via-orange-100/30 to-orange-50/70 p-3 rounded-xl border border-orange-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
            <Label className="text-sm font-semibold text-orange-800 flex items-center gap-4 mb-3 p-1.5 rounded-lg bg-orange-100/50 border border-orange-200/30">
              <span className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-sm">W</span>
              Who was involved?
            </Label>
            {editing ? (
              <Textarea
                value={editData.who}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditData({ ...editData, who: e.target.value })}
                className="text-sm resize-none"
                rows={2}
                placeholder="People involved in the incident..."
              />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{resolution.who}</p>
            )}
          </div>

          {/* Why */}
          <div className="bg-gradient-to-br from-red-50 via-red-100/30 to-red-50/70 p-3 rounded-xl border border-red-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
            <Label className="text-sm font-semibold text-red-800 flex items-center gap-4 mb-3 p-1.5 rounded-lg bg-red-100/50 border border-red-200/30">
              <span className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-sm">W</span>
              Why did it happen?
            </Label>
            {editing ? (
              <Textarea
                value={editData.why}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditData({ ...editData, why: e.target.value })}
                className="text-sm resize-none"
                rows={2}
                placeholder="Cause or reason for the incident..."
              />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{resolution.why}</p>
            )}
          </div>

          {/* How (Outcome) */}
          <div className="bg-gradient-to-br from-yellow-50 via-yellow-100/30 to-yellow-50/70 p-3 rounded-xl border border-yellow-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
            <Label className="text-sm font-semibold text-yellow-800 flex items-center gap-4 mb-3 p-1.5 rounded-lg bg-yellow-100/50 border border-yellow-200/30">
              <span className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-sm">H</span>
              How was it resolved?
            </Label>
            {editing ? (
              <select
                value={editData.how}
                onChange={(e) => setEditData({ ...editData, how: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {Object.entries(outcomeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <div>
                <Badge variant="outline" className="text-sm bg-yellow-100 text-yellow-800 border-yellow-300 px-3 py-1">
                  {outcomeLabels[resolution.how] || resolution.how}
                </Badge>
              </div>
            )}
          </div>

          {/* Personnel Notes */}
          {resolution.notes && (
            <div className="bg-gradient-to-br from-gray-50 via-gray-100/30 to-gray-50/70 p-3 rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
              <Label className="text-sm font-semibold text-gray-800 flex items-center gap-4 mb-3 p-1.5 rounded-lg bg-gray-100/50 border border-gray-200/30">
                <span className="bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-sm">📝</span>
                Personnel Notes
              </Label>
              {editing ? (
                <Textarea
                  value={editData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditData({ ...editData, notes: e.target.value })}
                  className="text-sm resize-none"
                  rows={2}
                  placeholder="Any additional notes or observations..."
                />
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed italic">{resolution.notes}</p>
              )}
            </div>
          )}

          {/* Personnel Information */}
          <div className="bg-gradient-to-br from-indigo-50 via-indigo-100/30 to-indigo-50/70 p-3 rounded-xl border border-indigo-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
            <Label className="text-sm font-semibold text-indigo-800 flex items-center gap-4 mb-3 p-1.5 rounded-lg bg-indigo-100/50 border border-indigo-200/30">
              <span className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-sm">👤</span>
              Submission Details
            </Label>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Personnel ID:</span> {resolution.submittedByPersonnelId}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Submitted:</span> {new Date(resolution.submittedAt).toLocaleString()}
              </p>
            </div>
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Modern Admin Notes Section */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
        {/* Blue Gradient Header */}
        <div className="relative overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-t-xl p-6 text-white relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.15),transparent_50%)] rounded-t-xl"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Admin Notes</h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Add your review notes before confirming
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 pt-0">
          <Textarea
            value={editData.adminNotes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditData({ ...editData, adminNotes: e.target.value })}
            placeholder="Add any additional notes or corrections..."
            rows={3}
            disabled={isConfirmed}
            className="resize-none"
          />
        </div>
      </div>

      {/* Modern Confirm Button */}
      {!isConfirmed && (
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleConfirmResolution}
            disabled={confirming}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-white font-semibold"
          >
            {confirming ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Confirm Resolution
              </>
            )}
          </Button>
        </div>
      )}

      {/* Modern Confirmed Info */}
      {isConfirmed && resolution.confirmedByAdmin && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-800 text-sm">Resolution Confirmed</h4>
              <p className="text-green-700 text-sm mt-1">
                Confirmed by {resolution.confirmedByAdmin.firstName} {resolution.confirmedByAdmin.lastName} on {format(new Date(resolution.confirmedAt!), 'MMM dd, yyyy \'at\' HH:mm')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}