<?php


class iCal
{
	/**
	 * @var string
	 */
	public $title;

	/**
	 * @var string
	 */
	public $description;

	/**
	 * @var array
	 */
	public $events = array();

	/**
	 * @var array
	 */
	protected $_eventsByDate;


	public function __construct($content = null)
	{
		if ($content) {
			$isUrl  = strpos($content, 'http') === 0 && filter_var($content, FILTER_VALIDATE_URL);
			$isFile = strpos($content, "\n") === false && file_exists($content);
			if ($isUrl || $isFile) {
				$content = file_get_contents($content);
			}
			$this->parse($content);
		}
	}


	public function title()
	{
		return $this->summary;
	}

	public function description()
	{
		return $this->description;
	}

	public function events()
	{
		return $this->events;
	}

	public function eventsByDate()
	{
		if (! $this->_eventsByDate) {
			$this->_eventsByDate = array();

			foreach ($this->events() as $event) {
				foreach ($event->occurrences() as $occurrence) {
					$date = $occurrence->format('Y-m-d');
					$this->_eventsByDate[$date][] = $event;
				}
			}
			ksort($this->_eventsByDate);
		}

		return $this->_eventsByDate;
	}

	public function eventsByDateBetween($start, $end)
	{
		if ((string) (int) $start !== (string) $start) {
			$start = strtotime($start);
		}
		$start = date('Y-m-d', $start);

		if ((string) (int) $end !== (string) $end) {
			$end = strtotime($end);
		}
		$end = date('Y-m-d', $end);

		$return = array();
		foreach ($this->eventsByDate() as $date => $events) {
			if ($start <= $date && $date <= $end) {
				$return[$date] = $events;
			}
		}

		return $return;
	}

	public function eventsByDateSince($start)
	{
		if ((string) (int) $start !== (string) $start) {
			$start = strtotime($start);
		}
		$start = date('Y-m-d', $start);

		$return = array();
		foreach ($this->eventsByDate() as $date => $events) {
			if ($start <= $date) {
				$return[$date] = $events;
			}
		}

		return $return;
	}

	public function parse($content)
	{
		$content = str_replace("\r\n ", '', $content);

		// Title
		preg_match('`^X-WR-CALNAME:(.*)$`m', $content, $m);
		$this->title = $m ? trim($m[1]) : null;

		// Description
		preg_match('`^X-WR-CALDESC:(.*)$`m', $content, $m);
		$this->description = $m ? trim($m[1]) : null;

		// Events
		preg_match_all('`BEGIN:VEVENT(.+)END:VEVENT`Us', $content, $m);
		foreach ($m[0] as $c) {
			$this->events[] = new iCal_Event($c);
		}

		return $this;
	}
}



class iCal_Event
{
	/**
	 * @var string
	 */
	public $uid;

	/**
	 * @var string
	 */
	public $summary;

	/**
	 * @var string
	 */
	public $description;

	/**
	 * @var string
	 */
	public $dateStart;

	/**
	 * @var string
	 */
	public $dateEnd;

	/**
	 * @var array
	 */
	public $exdate = array();

	/**
	 * @var stdClass
	 */
	public $recurrence;

	/**
	 * @var string
	 */
	public $location;

	/**
	 * @var string
	 */
	public $status;

	/**
	 * @var string
	 */
	public $class;

	/**
	 * @var string
	 */
	public $created;

	/**
	 * @var string
	 */
	public $updated;

	/**
	 * @var integer
	 */
	protected $_timeStart;

	/**
	 * @var integer
	 */
	protected $_timeEnd;

	/**
	 * @var array
	 */
	protected $_occurrences;


	public function __construct($content = null)
	{
		if ($content) {
			$this->parse($content);
		}
	}


	public function summary()
	{
		return $this->summary;
	}

	public function title()
	{
		return $this->summary;
	}

	public function description()
	{
		return $this->description;
	}

	public function occurrences()
	{
		if (empty($this->_occurrences)) {
			$this->_occurrences = $this->_calculateOccurrences();
		}
		return $this->_occurrences;
	}

	public function duration()
	{
		if ($this->_timeEnd) {
			return $this->_timeEnd - $this->_timeStart;
		}
	}

	public function parse($content)
	{
		$content = str_replace("\r\n ", '', $content);

		// UID
		if (preg_match('`^UID:(.*)$`m', $content, $m))
			$this->uid = trim($m[1]);

		// Summary
		if (preg_match('`^SUMMARY:(.*)$`m', $content, $m))
			$this->summary = trim($m[1]);

		// Description
		if (preg_match('`^DESCRIPTION:(.*)$`m', $content, $m))
			$this->description = trim($m[1]);

		// Date start
		if (preg_match('`^DTSTART(?:;.+)?:([0-9]+(T[0-9]+Z?)?)`m', $content, $m)) {
			$this->_timeStart = strtotime($m[1]);
			$this->dateStart  = date('Y-m-d H:i:s', $this->_timeStart);
		}

		// Date end
		if (preg_match('`^DTEND(?:;.+)?:([0-9]+(T[0-9]+Z?)?)`m', $content, $m)) {
			$this->_timeEnd = strtotime($m[1]);
			$this->dateEnd  = date('Y-m-d H:i:s', $this->_timeEnd);
		}

		// Exdate
		if (preg_match_all('`^EXDATE(;.+)?:([0-9]+(T[0-9]+Z?)?)`m', $content, $m)) {
			foreach ($m[2] as $dates) {
				$dates = explode(',', $dates);
				foreach ($dates as $d) {
					$this->exdate[] = date('Y-m-d', strtotime($d));
				}
			}
		}


		// Recurrence
		if (preg_match('`^RRULE:(.*)`m', $content, $m)) {
			$rules = (object) array();
			$rule = trim($m[1]);

			$rule = explode(';', $rule);
			foreach ($rule as $r) {
				list($key, $value) = explode('=', $r);
				$rules->{ strtolower($key) } = $value;
			}

			if (isset($rules->until)) {
				$rules->until = date('Y-m-d H:i:s', strtotime($rules->until));
			}
			if (isset($rules->count)) {
				$rules->count = intval($rules->count);
			}
			if (isset($rules->interval)) {
				$rules->interval = intval($rules->interval);
			}
			if (isset($rules->byday)) {
				$rules->byday = explode(',', $rules->byday);
			}

			// Avoid infinite recurrences
			if (! isset($rules->until) && ! isset($rules->count)) {
				$rules->count = 500;
			}

			$this->recurrence = $rules;
		}


		// Location
		if (preg_match('`^LOCATION:(.*)$`m', $content, $m))
			$this->location = trim($m[1]);

		// Status
		if (preg_match('`^STATUS:(.*)$`m', $content, $m))
			$this->status = trim($m[1]);

		// Class
		if (preg_match('`^CLASS:(.*)$`m', $content, $m))
			$this->class = trim($m[1]);


		// Created
		if (preg_match('`^CREATED:(.*)`m', $content, $m))
			$this->created = date('Y-m-d H:i:s', strtotime(trim($m[1])));

		// Updated
		if (preg_match('`^LAST-MODIFIED:(.*)`m', $content, $m))
			$this->updated = date('Y-m-d H:i:s', strtotime(trim($m[1])));

		return $this;
	}

	public function isRecurrent()
	{
		return ! empty($this->recurrence);
	}

	protected function _isExdate($date)
	{
		if ((string) (int) $date != $date) {
			$date = strtotime($date);
		}
		$date = date('Y-m-d', $date);

		return in_array($date, $this->exdate);
	}

	protected function _calculateOccurrences()
	{
		$occurrences = array($this->_timeStart);

		if ($this->isRecurrent())
		{
			$freq  = $this->recurrence->freq;
			$count = isset($this->recurrence->count) ? $this->recurrence->count : null;
			$until = isset($this->recurrence->until) ? strtotime($this->recurrence->until) : null;

			$callbacks = array(
				'YEARLY'  => '_nextYearlyOccurrence',
				'MONTHLY' => '_nextMonthlyOccurrence',
				'WEEKLY'  => '_nextWeeklyOccurrence',
				'DAILY' => '_nextDailyOccurrence'
			);
			$callback = $callbacks[$freq];

			$offset = $this->_timeStart;
			$continue = $until ? ($offset < $until) : ($count > 1);
			while ($continue) {
				$occurrence = $this->{$callback}($offset);

				if (! $this->_isExdate($occurrence)) {
					$occurrences[] = $occurrence;
					$count--;
				}

				$offset = $occurrence;
				$continue = $until ? ($offset < $until) : ($count > 1);
			}
		}

		if ($this->_isExdate($occurrences[0])) {
			unset($occurrences[0]);
			$occurrences = array_values($occurrences);
		}

		// Convertion to object
		$event = $this;
		$occurrences = array_map(
			function($o) use ($event) { return new iCal_Occurrence($event, $o); },
			$occurrences
		);

		return $occurrences;
	}

	protected function _nextYearlyOccurrence($offset)
	{
		$interval = isset($this->recurrence->interval) 
			? $this->recurrence->interval 
			: 1;

		return strtotime("+{$interval} year", $offset);
	}

	protected function _nextMonthlyOccurrence($offset)
	{
		$interval = isset($this->recurrence->interval) 
			? $this->recurrence->interval 
			: 1;

		$bymonthday = isset($this->recurrence->bymonthdays) 
			? explode(',', $this->recurrence->bymonthday) 
			: array(date('d', $offset));

		$start = strtotime(date('Y-m-01 H:i:s', $offset));

		$dates = array();
		foreach ($bymonthday as $day) {
			// this month
			$dates[] = strtotime(($day-1) . ' day', $start);

			// next 'interval' month
			$tmp  = strtotime("+{$interval} month", $start);
			$time = strtotime(($day-1) . ' day', $tmp);
			if ((string) (int) date('d', $time) == (int) $day) {
				$dates[] = $time;
			}

			// 2x 'interval' month
			$interval *= 2;
			$tmp  = strtotime("+{$interval} month", $start);
			$time = strtotime(($day-1) . ' day', $tmp);
			if ((string) (int) date('d', $time) === (int) $day) {
				$dates[] = $time;
			}
		}
		sort($dates);

		foreach ($dates as $date) {
			if ($date > $offset) {
				return $date;
			}
		}
	}

	protected function _nextWeeklyOccurrence($offset)
	{
		$interval = isset($this->recurrence->interval) 
			? $this->recurrence->interval 
			: 1;

		$byday = isset($this->recurrence->byday) 
			? $this->recurrence->byday 
			: array( substr(strtoupper(date('D', $offset)), 0, 2) );

		$start = date('l', $offset) !== 'Monday'
			? strtotime('last monday', $offset) 
			: $offset;

		$daysname = array(
			'MO' => 'monday',
			'TU' => 'tuesday',
			'WE' => 'wednesday',
			'TH' => 'thursday',
			'FR' => 'friday',
			'SA' => 'saturday',
			'SU' => 'sunday',
		);

		$dates = array();
		foreach ($byday as $day) {
			$dayname = $daysname[$day];

			// this week
			$dates[] = strtotime($dayname, $start);

			// next 'interval' week
			$tmp  = strtotime("+{$interval} week", $start);
			$time = strtotime($dayname, $tmp);
			$dates[] = $time;
		}
		sort($dates);

		foreach ($dates as $date) {
			if ($date > $offset) {
				return $date;
			}
		}
	}
	
	protected function _nextDailyOccurrence($offset)
	{
		$interval = isset($this->recurrence->interval)
			? $this->recurrence->interval
			: 1;

		return strtotime("+{$interval} day", $offset);
	}
}



class iCal_Occurrence
{

	/**
	 * @var iCal_Event
	 */
	protected $_event;

	/**
	 * @var integer
	 */
	protected $_timestamp;


	public function __construct(iCal_Event $event, $timestamp)
	{
		$this->_event     = $event;
		$this->_timestamp = $timestamp;
	}

	public function __toString()
	{
		return (string) $this->_timestamp;
	}


	public function format($format = 'U')
	{
		return date($format, $this->_timestamp);
	}

	public function duration($format = 'U')
	{
		return date($format, $this->_event->duration());
	}

}
